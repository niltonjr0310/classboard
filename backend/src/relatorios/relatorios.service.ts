import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type FiltrosRelatorio = {
  de?: string;
  ate?: string;
  professorId?: string;
  turmaId?: string;
  tipo?: string;
};

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function inteiro(v: string | undefined, nome: string): number | undefined {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(`Filtro inválido: ${nome}.`);
  return n;
}

@Injectable()
export class RelatoriosService {
  constructor(private prisma: PrismaService) {}

  async resumo(escolaId: number, f: FiltrosRelatorio) {
    if (f.de && !DATA.test(f.de)) throw new BadRequestException('Data inicial inválida (use AAAA-MM-DD).');
    if (f.ate && !DATA.test(f.ate)) throw new BadRequestException('Data final inválida (use AAAA-MM-DD).');
    if (f.tipo && f.tipo !== 'aula' && f.tipo !== 'prova') throw new BadRequestException('Tipo inválido.');

    const professorId = inteiro(f.professorId, 'professor');
    const turmaId = inteiro(f.turmaId, 'turma');

    // dias considerados no horário de Brasília (UTC-3, sem horário de verão)
    const dataHora: { gte?: Date; lte?: Date } = {};
    if (f.de) dataHora.gte = new Date(`${f.de}T00:00:00-03:00`);
    if (f.ate) dataHora.lte = new Date(`${f.ate}T23:59:59.999-03:00`);

    const aulas = await this.prisma.aula.findMany({
      where: {
        escolaId,
        ...(Object.keys(dataHora).length ? { dataHora } : {}),
        ...(professorId ? { professorId } : {}),
        ...(f.tipo ? { tipo: f.tipo } : {}),
        ...(turmaId ? { aluno: { turmaId } } : {}),
      },
      include: { professor: true, aluno: { include: { turma: true } } },
      orderBy: { dataHora: 'asc' },
    });

    const totais = {
      total: aulas.length,
      aulas: 0,
      provas: 0,
      agendadas: 0,
      concluidas: 0,
      canceladas: 0,
      horas: 0,
    };
    const porProfessor = new Map<string, { professor: string; total: number; aulas: number; provas: number; concluidas: number; canceladas: number }>();
    const porMateria = new Map<string, number>();
    const porTurma = new Map<string, number>();
    let minutos = 0;

    for (const a of aulas) {
      const prova = a.tipo === 'prova';
      if (prova) totais.provas++;
      else totais.aulas++;
      if (a.status === 'cancelada') totais.canceladas++;
      else {
        minutos += a.duracao;
        if (a.status === 'concluida') totais.concluidas++;
        else totais.agendadas++;
      }

      const p =
        porProfessor.get(a.professor.nome) ??
        { professor: a.professor.nome, total: 0, aulas: 0, provas: 0, concluidas: 0, canceladas: 0 };
      p.total++;
      if (prova) p.provas++;
      else p.aulas++;
      if (a.status === 'concluida') p.concluidas++;
      if (a.status === 'cancelada') p.canceladas++;
      porProfessor.set(a.professor.nome, p);

      const materia = a.materia || 'Sem matéria';
      porMateria.set(materia, (porMateria.get(materia) ?? 0) + 1);

      const turma = a.aluno.turma?.nome || 'Sem turma';
      porTurma.set(turma, (porTurma.get(turma) ?? 0) + 1);
    }

    totais.horas = Math.round((minutos / 60) * 10) / 10;

    const ordenar = <T extends { total: number }>(l: T[]) => l.sort((x, y) => y.total - x.total);

    return {
      totais,
      porProfessor: ordenar([...porProfessor.values()]),
      porMateria: ordenar([...porMateria].map(([materia, total]) => ({ materia, total }))),
      porTurma: ordenar([...porTurma].map(([turma, total]) => ({ turma, total }))),
      itens: aulas.map((a) => ({
        id: a.id,
        dataHora: a.dataHora,
        duracao: a.duracao,
        tipo: a.tipo,
        status: a.status,
        materia: a.materia,
        professor: a.professor.nome,
        aluno: a.aluno.nome,
        turma: a.aluno.turma?.nome ?? null,
      })),
    };
  }
}
