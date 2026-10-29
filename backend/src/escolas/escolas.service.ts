import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { garantirEmailLivre } from '../auth/email-livre';

export type DadosEscola = { nome?: string; logoUrl?: string | null };

function limpar(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Só aceita endereço http(s) para o logo (ou vazio, para remover). */
function validarLogo(v: unknown): string | null {
  const url = limpar(v);
  if (!url) return null;
  if (!/^https?:\/\/\S+$/i.test(url)) {
    throw new BadRequestException('O logo precisa ser um link http(s) de imagem.');
  }
  return url;
}

@Injectable()
export class EscolasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.escola.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { alunos: true, professores: true, turmas: true, aulas: true } } },
    });
  }

  findOne(id: number) {
    return this.prisma.escola.findUnique({ where: { id } });
  }

  async create(dados: DadosEscola & { adminEmail?: string; adminNome?: string }) {
    const nome = limpar(dados.nome);
    if (!nome) throw new BadRequestException('Informe o nome da escola.');
    const logoUrl = validarLogo(dados.logoUrl);
    const adminEmail = limpar(dados.adminEmail).toLowerCase();

    if (adminEmail) await garantirEmailLivre(this.prisma, adminEmail);

    return this.prisma.escola.create({
      data: {
        nome,
        logoUrl,
        ...(adminEmail
          ? { admins: { create: { email: adminEmail, nome: limpar(dados.adminNome) || adminEmail } } }
          : {}),
      },
      include: { admins: true },
    });
  }

  async update(id: number, dados: DadosEscola) {
    const data: { nome?: string; logoUrl?: string | null } = {};
    if (dados.nome !== undefined) {
      const nome = limpar(dados.nome);
      if (!nome) throw new BadRequestException('O nome da escola não pode ficar vazio.');
      data.nome = nome;
    }
    if (dados.logoUrl !== undefined) data.logoUrl = validarLogo(dados.logoUrl);

    const existe = await this.prisma.escola.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Escola não encontrada.');
    return this.prisma.escola.update({ where: { id }, data });
  }

  async remove(id: number) {
    const existe = await this.prisma.escola.findUnique({ where: { id } });
    if (!existe) throw new NotFoundException('Escola não encontrada.');

    const [alunos, professores, aulas, turmas] = await Promise.all([
      this.prisma.aluno.count({ where: { escolaId: id } }),
      this.prisma.professor.count({ where: { escolaId: id } }),
      this.prisma.aula.count({ where: { escolaId: id } }),
      this.prisma.turma.count({ where: { escolaId: id } }),
    ]);
    if (alunos + professores + aulas + turmas > 0) {
      throw new ConflictException(
        'Essa escola ainda tem alunos, professores, turmas ou aulas. Remova-os antes de excluir.',
      );
    }
    await this.prisma.admin.deleteMany({ where: { escolaId: id } });
    return this.prisma.escola.delete({ where: { id } });
  }

  // ---- administradores da escola ----

  listAdmins(escolaId: number) {
    return this.prisma.admin.findMany({ where: { escolaId }, orderBy: { nome: 'asc' } });
  }

  async addAdmin(escolaId: number, dados: { nome?: string; email?: string }) {
    const email = limpar(dados.email).toLowerCase();
    if (!email || !email.includes('@')) throw new BadRequestException('Informe um e-mail válido.');
    const escola = await this.prisma.escola.findUnique({ where: { id: escolaId } });
    if (!escola) throw new NotFoundException('Escola não encontrada.');
    await garantirEmailLivre(this.prisma, email);
    return this.prisma.admin.create({
      data: { escolaId, email, nome: limpar(dados.nome) || email },
    });
  }

  async removeAdmin(escolaId: number, adminId: number) {
    const resultado = await this.prisma.admin.deleteMany({ where: { id: adminId, escolaId } });
    if (resultado.count === 0) throw new NotFoundException('Administrador não encontrado.');
    return { ok: true };
  }
}
