import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { garantirEmailLivre } from '../auth/email-livre';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';

const VALIDADE_PEDIDO_MS = 30 * 24 * 60 * 60 * 1000;
const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Nunca devolve o token do consentimento para o painel. */
function limpo<T extends { consentimentoToken?: string | null }>(aluno: T) {
  if (!aluno) return aluno;
  const { consentimentoToken: _t, ...resto } = aluno;
  return resto;
}

@Injectable()
export class AlunosService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /** Só campos permitidos: o cliente nunca define escolaId. */
  private async dados(dto: UpdateAlunoDto, escolaId: number, proprioId?: number) {
    const data: {
      nome?: string;
      email?: string;
      serie?: string;
      turmaId?: number | null;
      responsavelNome?: string | null;
      responsavelEmail?: string | null;
      responsavelTelefone?: string | null;
    } = {};
    if (dto.responsavelNome !== undefined) data.responsavelNome = dto.responsavelNome?.trim() || null;
    if (dto.responsavelEmail !== undefined)
      data.responsavelEmail = dto.responsavelEmail?.trim().toLowerCase() || null;
    if (dto.responsavelTelefone !== undefined)
      data.responsavelTelefone = dto.responsavelTelefone?.trim() || null;
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      await garantirEmailLivre(
        this.prisma,
        email,
        proprioId ? { tipo: 'aluno', id: proprioId } : undefined,
      );
      data.email = email;
    }
    if (dto.serie !== undefined) data.serie = dto.serie;
    if (dto.turmaId !== undefined) {
      if (dto.turmaId !== null) {
        const turma = await this.prisma.turma.findFirst({ where: { id: dto.turmaId, escolaId } });
        if (!turma) throw new BadRequestException('Turma não encontrada nesta escola.');
      }
      data.turmaId = dto.turmaId;
    }
    return data;
  }

  private async garantir(id: number, escolaId: number) {
    const aluno = await this.prisma.aluno.findFirst({ where: { id, escolaId } });
    if (!aluno) throw new NotFoundException('Aluno não encontrado.');
    return aluno;
  }

  async create(dto: CreateAlunoDto, escolaId: number) {
    const data = await this.dados(dto, escolaId);
    let aluno;
    try {
      aluno = await this.prisma.aluno.create({
        data: { nome: dto.nome, email: dto.email, serie: dto.serie, ...data, escolaId },
      });
    } catch (e) {
      throw this.traduzir(e);
    }
    if (aluno?.responsavelEmail) return limpo(await this.pedirConsentimento(aluno.id, escolaId));
    return limpo(aluno);
  }

  /** Gera um link novo, zera o consentimento anterior e avisa o responsável por e-mail. */
  private async pedirConsentimento(id: number, escolaId: number) {
    const aluno = await this.garantir(id, escolaId);
    if (!aluno.responsavelEmail) {
      throw new BadRequestException('Cadastre o e-mail do responsável primeiro.');
    }
    const token = randomBytes(32).toString('hex');
    const atualizado = await this.prisma.aluno.update({
      where: { id },
      data: { consentimentoToken: token, consentimentoEnviadoEm: new Date(), consentimentoEm: null },
    });
    const escola = await this.prisma.escola.findUnique({ where: { id: escolaId } });
    const nomeEscola = escola?.nome ?? 'Escola';
    const base = process.env.FRONTEND_URL || 'https://classboard-three.vercel.app';
    const link = `${base.replace(/\/$/, '')}/consentimento/${token}`;
    const saudacao = aluno.responsavelNome ? `Olá, ${esc(aluno.responsavelNome)}!` : 'Olá!';
    await this.emailService.enviar(
      aluno.responsavelEmail,
      `Autorização de uso de dados — ${nomeEscola}`,
      `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111827">` +
        `<h3>${esc(nomeEscola)}</h3><p>${saudacao}</p>` +
        `<p>A escola usa o ClassBoard para agendar aulas e provas de reforço. Para cadastrar os dados de <strong>${esc(aluno.nome)}</strong> (nome, e-mail, turma e aulas), precisamos da sua autorização como responsável.</p>` +
        `<p><a href="${link}" style="display:inline-block;background:#059669;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ler e autorizar</a></p>` +
        `<p style="color:#6b7280;font-size:13px">O link vale por 30 dias. Se você não reconhece este pedido, ignore este e-mail.</p>` +
        `<hr style="border:none;border-top:1px solid #e5e7eb;margin:22px 0 10px"><p style="color:#9ca3af;font-size:12px;margin:0">Enviado pelo ClassBoard</p></div>`,
      nomeEscola,
    );
    return atualizado;
  }

  async reenviarConsentimento(id: number, escolaId: number) {
    const a = await this.garantir(id, escolaId);
    if (a.consentimentoEm) throw new BadRequestException('O responsável já autorizou.');
    await this.pedirConsentimento(id, escolaId);
    return { ok: true };
  }

  private async porToken(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new NotFoundException('Link inválido.');
    const aluno = await this.prisma.aluno.findUnique({
      where: { consentimentoToken: token },
      include: { escola: true },
    });
    if (!aluno) throw new NotFoundException('Link inválido ou substituído por um mais novo.');
    return aluno;
  }

  private expirado(a: { consentimentoEm: Date | null; consentimentoEnviadoEm: Date | null }) {
    return (
      !a.consentimentoEm &&
      !!a.consentimentoEnviadoEm &&
      Date.now() - a.consentimentoEnviadoEm.getTime() > VALIDADE_PEDIDO_MS
    );
  }

  /** Dados mostrados na página pública (sem login) do responsável. */
  async consultarConsentimento(token: string) {
    const a = await this.porToken(token);
    return {
      escola: a.escola.nome,
      aluno: a.nome,
      responsavel: a.responsavelNome,
      autorizadoEm: a.consentimentoEm,
      expirado: this.expirado(a),
    };
  }

  async autorizarConsentimento(token: string) {
    const a = await this.porToken(token);
    if (a.consentimentoEm) return { autorizadoEm: a.consentimentoEm };
    if (this.expirado(a)) {
      throw new BadRequestException('Este link expirou. Peça à escola para enviar outro.');
    }
    const r = await this.prisma.aluno.update({
      where: { id: a.id },
      data: { consentimentoEm: new Date() },
    });
    return { autorizadoEm: r.consentimentoEm };
  }

  async findAll(escolaId: number) {
    const lista = await this.prisma.aluno.findMany({
      where: { escolaId },
      include: { turma: { select: { id: true, nome: true } } },
      orderBy: { nome: 'asc' },
    });
    return (lista ?? []).map(limpo);
  }

  async findOne(id: number, escolaId: number) {
    return limpo(await this.garantir(id, escolaId));
  }

  async update(id: number, dto: UpdateAlunoDto, escolaId: number) {
    const antes = await this.garantir(id, escolaId);
    const data = await this.dados(dto, escolaId, id);
    let aluno;
    try {
      aluno = await this.prisma.aluno.update({ where: { id }, data });
    } catch (e) {
      throw this.traduzir(e);
    }
    // E-mail do responsável novo ou trocado: pede a autorização de novo.
    if (
      data.responsavelEmail !== undefined &&
      data.responsavelEmail &&
      data.responsavelEmail !== antes.responsavelEmail
    ) {
      return limpo(await this.pedirConsentimento(id, escolaId));
    }
    // E-mail do responsável removido: apaga o consentimento pendente.
    if (data.responsavelEmail === null) {
      aluno = await this.prisma.aluno.update({
        where: { id },
        data: { consentimentoToken: null, consentimentoEnviadoEm: null, consentimentoEm: null },
      });
    }
    return limpo(aluno);
  }

  async remove(id: number, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.aluno.delete({ where: { id } });
  }

  private traduzir(e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return new ConflictException('Esse e-mail já está cadastrado no ClassBoard.');
    }
    return e;
  }
}
