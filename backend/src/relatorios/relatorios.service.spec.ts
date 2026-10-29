jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosService', () => {
  const prisma = { aula: { findMany: jest.fn() } };
  const service = new RelatoriosService(prisma as any);

  const aula = (o: Record<string, unknown>) => ({
    id: 1,
    dataHora: new Date('2026-11-10T17:00:00Z'),
    duracao: 60,
    tipo: 'aula',
    status: 'agendada',
    materia: 'Matemática',
    professor: { nome: 'Ana' },
    aluno: { nome: 'Beto', turma: { nome: '9A' } },
    ...o,
  });

  beforeEach(() => jest.resetAllMocks());

  it('sempre filtra pela escola e converte as datas para o horário de Brasília', async () => {
    prisma.aula.findMany.mockResolvedValue([]);
    await service.resumo(5, { de: '2026-11-01', ate: '2026-11-30', turmaId: '3', professorId: '2', tipo: 'prova' });
    const where = prisma.aula.findMany.mock.calls[0][0].where;
    expect(where.escolaId).toBe(5);
    expect(where.dataHora.gte.toISOString()).toBe('2026-11-01T03:00:00.000Z');
    expect(where.dataHora.lte.toISOString()).toBe('2026-12-01T02:59:59.999Z');
    expect(where.aluno).toEqual({ turmaId: 3 });
    expect(where.professorId).toBe(2);
    expect(where.tipo).toBe('prova');
  });

  it('rejeita filtros inválidos', async () => {
    await expect(service.resumo(1, { de: '10/11/2026' })).rejects.toThrow(BadRequestException);
    await expect(service.resumo(1, { professorId: 'abc' })).rejects.toThrow(BadRequestException);
    await expect(service.resumo(1, { tipo: 'outro' })).rejects.toThrow(BadRequestException);
  });

  it('soma totais, ignora canceladas nas horas e agrupa', async () => {
    prisma.aula.findMany.mockResolvedValue([
      aula({ id: 1, status: 'concluida', duracao: 90 }),
      aula({ id: 2, tipo: 'prova', status: 'agendada', duracao: 30 }),
      aula({ id: 3, status: 'cancelada', duracao: 60, materia: null, aluno: { nome: 'C', turma: null } }),
    ]);
    const r = await service.resumo(1, {});
    expect(r.totais).toMatchObject({ total: 3, aulas: 2, provas: 1, agendadas: 1, concluidas: 1, canceladas: 1, horas: 2 });
    expect(r.porProfessor[0]).toMatchObject({ professor: 'Ana', total: 3, provas: 1, canceladas: 1 });
    expect(r.porMateria).toEqual(expect.arrayContaining([{ materia: 'Sem matéria', total: 1 }, { materia: 'Matemática', total: 2 }]));
    expect(r.porTurma).toEqual(expect.arrayContaining([{ turma: 'Sem turma', total: 1 }, { turma: '9A', total: 2 }]));
    expect(r.itens).toHaveLength(3);
  });
});
