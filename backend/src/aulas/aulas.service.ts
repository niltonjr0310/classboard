import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { EmailService } from '../email/email.service';

type Escola = { nome: string; logoUrl: string | null };

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function descrever(aula: { tipo: string; materia: string | null; dataHora: Date }) {
  const tipo = aula.tipo === 'prova' ? 'prova' : 'aula';
  return {
    tipo,
    tipoCap: tipo === 'prova' ? 'Prova' : 'Aula',
    deMateria: aula.materia ? ` de ${aula.materia}` : '',
    data: aula.dataHora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  };
}

/** Moldura do e-mail com o nome e o logo da escola. */
function emailHtml(escola: Escola, corpo: string) {
  const logo =
    escola.logoUrl && /^https?:\/\//i.test(escola.logoUrl)
      ? `<img src="${esc(escola.logoUrl)}" alt="" style="height:44px;margin-bottom:8px">`
      : '';
  return (
    `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111827">` +
    `${logo}<h3 style="margin:0 0 14px">${esc(escola.nome)}</h3>${corpo}` +
    `<hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0 10px">` +
    `<p style="color:#9ca3af;font-size:12px;margin:0">Enviado pelo ClassBoard</p></div>`
  );
}

const INCLUDE = { professor: true, aluno: { include: { turma: true } } } as const;

@Injectable()
export class AulasService {
  constructor(
    private prisma: PrismaService,
    private notificacoesService: NotificacoesService,
    private emailService: EmailService,
  ) {}

  /** Professor e aluno precisam ser da mesma escola da aula. */
  private async validarParticipantes(escolaId: number, professorId?: number, alunoId?: number) {
    if (professorId !== undefined) {
      const p = await this.prisma.professor.findFirst({ where: { id: professorId, escolaId } });
      if (!p) throw new BadRequestException('Professor não encontrado nesta escola.');
    }
    if (alunoId !== undefined) {
      const a = await this.prisma.aluno.findFirst({ where: { id: alunoId, escolaId } });
      if (!a) throw new BadRequestException('Aluno não encontrado nesta escola.');
    }
  }

  private async garantir(id: number, escolaId: number) {
    const aula = await this.prisma.aula.findFirst({ where: { id, escolaId } });
    if (!aula) throw new NotFoundException('Aula não encontrada.');
    return aula;
  }

  async create(dto: CreateAulaDto, escolaId: number) {
    await this.validarParticipantes(escolaId, dto.professorId, dto.alunoId);

    const aula = await this.prisma.aula.create({
      data: {
        dataHora: new Date(dto.dataHora),
        duracao: dto.duracao,
        status: dto.status,
        tipo: dto.tipo === 'prova' ? 'prova' : 'aula',
        materia: dto.materia?.trim() || null,
        professorId: dto.professorId,
        alunoId: dto.alunoId,
        escolaId,
      },
      include: { professor: true, aluno: true, escola: true },
    });

    const { tipo, tipoCap, deMateria, data } = descrever(aula);
    const materia = esc(deMateria);
    const escola = aula.escola;
    const assunto = `Nova ${tipo} agendada — ${escola.nome}`;

    await Promise.all([
      this.notificacoesService.criar(
        'ALUNO',
        aula.alunoId,
        `Nova ${tipo} agendada`,
        `Sua ${tipo}${deMateria} com o professor ${aula.professor.nome} foi agendada para ${data}.`,
      ),
      this.notificacoesService.criar(
        'PROFESSOR',
        aula.professorId,
        `Nova ${tipo} agendada`,
        `Uma ${tipo}${deMateria} com o aluno ${aula.aluno.nome} foi agendada para ${data}.`,
      ),
      this.emailService.enviar(
        aula.aluno.email,
        assunto,
        emailHtml(
          escola,
          `<p>Olá, ${esc(aula.aluno.nome)}!</p><p><strong>${tipoCap}${materia}</strong> com o professor <strong>${esc(aula.professor.nome)}</strong> agendada para <strong>${data}</strong>.</p>`,
        ),
        escola.nome,
      ),
      this.emailService.enviar(
        aula.professor.email,
        assunto,
        emailHtml(
          escola,
          `<p>Olá, ${esc(aula.professor.nome)}!</p><p><strong>${tipoCap}${materia}</strong> com o aluno <strong>${esc(aula.aluno.nome)}</strong> agendada para <strong>${data}</strong>.</p>`,
        ),
        escola.nome,
      ),
    ]);

    return aula;
  }

  findAll(escolaId: number) {
    return this.prisma.aula.findMany({
      where: { escolaId },
      include: INCLUDE,
      orderBy: { dataHora: 'asc' },
    });
  }

  findByAluno(alunoId: number, escolaId: number) {
    return this.prisma.aula.findMany({
      where: { alunoId, escolaId },
      include: INCLUDE,
      orderBy: { dataHora: 'asc' },
    });
  }

  findByProfessor(professorId: number, escolaId: number) {
    return this.prisma.aula.findMany({
      where: { professorId, escolaId },
      include: INCLUDE,
      orderBy: { dataHora: 'asc' },
    });
  }

  async findOne(id: number, escolaId: number) {
    const aula = await this.prisma.aula.findFirst({ where: { id, escolaId }, include: INCLUDE });
    if (!aula) throw new NotFoundException('Aula não encontrada.');
    return aula;
  }

  async update(id: number, dto: UpdateAulaDto, escolaId: number) {
    const aulaAnterior = await this.garantir(id, escolaId);
    await this.validarParticipantes(escolaId, dto.professorId, dto.alunoId);

    const data: Prisma.AulaUncheckedUpdateInput = {};
    if (dto.dataHora) data.dataHora = new Date(dto.dataHora);
    if (dto.duracao !== undefined) data.duracao = dto.duracao;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.tipo !== undefined) data.tipo = dto.tipo === 'prova' ? 'prova' : 'aula';
    if (dto.materia !== undefined) data.materia = dto.materia?.trim() || null;
    if (dto.professorId !== undefined) data.professorId = dto.professorId;
    if (dto.alunoId !== undefined) data.alunoId = dto.alunoId;

    const aula = await this.prisma.aula.update({
      where: { id },
      data,
      include: { professor: true, aluno: true, escola: true },
    });

    const virouCancelada = dto.status === 'cancelada' && aulaAnterior.status !== 'cancelada';

    if (virouCancelada) {
      const { tipo, tipoCap, deMateria, data: dataFmt } = descrever(aula);
      const materia = esc(deMateria);
      const escola = aula.escola;
      const assunto = `${tipoCap} cancelada — ${escola.nome}`;

      await Promise.all([
        this.notificacoesService.criar(
          'ALUNO',
          aula.alunoId,
          `${tipoCap} cancelada`,
          `Sua ${tipo}${deMateria} com o professor ${aula.professor.nome} de ${dataFmt} foi cancelada.`,
        ),
        this.notificacoesService.criar(
          'PROFESSOR',
          aula.professorId,
          `${tipoCap} cancelada`,
          `Sua ${tipo}${deMateria} com o aluno ${aula.aluno.nome} de ${dataFmt} foi cancelada.`,
        ),
        this.emailService.enviar(
          aula.aluno.email,
          assunto,
          emailHtml(
            escola,
            `<p>Olá, ${esc(aula.aluno.nome)}.</p><p>Sua ${tipo}${materia} com o professor <strong>${esc(aula.professor.nome)}</strong> marcada para <strong>${dataFmt}</strong> foi <strong>cancelada</strong>.</p>`,
          ),
          escola.nome,
        ),
        this.emailService.enviar(
          aula.professor.email,
          assunto,
          emailHtml(
            escola,
            `<p>Olá, ${esc(aula.professor.nome)}.</p><p>Sua ${tipo}${materia} com o aluno <strong>${esc(aula.aluno.nome)}</strong> marcada para <strong>${dataFmt}</strong> foi <strong>cancelada</strong>.</p>`,
          ),
          escola.nome,
        ),
      ]);
    }

    // Remarcada: mudou a data/hora e a aula não está cancelada (cancelamento já avisa por si).
    const mudouHorario =
      !virouCancelada &&
      aula.status !== 'cancelada' &&
      dto.dataHora !== undefined &&
      aula.dataHora.getTime() !== aulaAnterior.dataHora.getTime();

    if (mudouHorario) {
      const { tipo, tipoCap, deMateria, data: dataNova } = descrever(aula);
      const dataAntiga = descrever(aulaAnterior).data;
      const materia = esc(deMateria);
      const escola = aula.escola;
      const assunto = `${tipoCap} remarcada — ${escola.nome}`;

      await Promise.all([
        this.notificacoesService.criar(
          'ALUNO',
          aula.alunoId,
          `${tipoCap} remarcada`,
          `Sua ${tipo}${deMateria} com o professor ${aula.professor.nome} foi remarcada de ${dataAntiga} para ${dataNova}.`,
        ),
        this.notificacoesService.criar(
          'PROFESSOR',
          aula.professorId,
          `${tipoCap} remarcada`,
          `Sua ${tipo}${deMateria} com o aluno ${aula.aluno.nome} foi remarcada de ${dataAntiga} para ${dataNova}.`,
        ),
        this.emailService.enviar(
          aula.aluno.email,
          assunto,
          emailHtml(
            escola,
            `<p>Olá, ${esc(aula.aluno.nome)}.</p><p>Sua ${tipo}${materia} com o professor <strong>${esc(aula.professor.nome)}</strong> foi <strong>remarcada</strong>.</p><p>De: ${dataAntiga}<br>Para: <strong>${dataNova}</strong></p>`,
          ),
          escola.nome,
        ),
        this.emailService.enviar(
          aula.professor.email,
          assunto,
          emailHtml(
            escola,
            `<p>Olá, ${esc(aula.professor.nome)}.</p><p>Sua ${tipo}${materia} com o aluno <strong>${esc(aula.aluno.nome)}</strong> foi <strong>remarcada</strong>.</p><p>De: ${dataAntiga}<br>Para: <strong>${dataNova}</strong></p>`,
          ),
          escola.nome,
        ),
      ]);
    }

    return aula;
  }

  async remove(id: number, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.aula.delete({ where: { id } });
  }
}
