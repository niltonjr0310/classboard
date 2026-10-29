import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurmasService {
  constructor(private prisma: PrismaService) {}

  private nomeValido(nome: unknown): string {
    const n = typeof nome === 'string' ? nome.trim() : '';
    if (!n) throw new BadRequestException('Informe o nome da turma.');
    return n;
  }

  private async garantir(id: number, escolaId: number) {
    const turma = await this.prisma.turma.findFirst({ where: { id, escolaId } });
    if (!turma) throw new NotFoundException('Turma não encontrada.');
    return turma;
  }

  findAll(escolaId: number) {
    return this.prisma.turma.findMany({
      where: { escolaId },
      orderBy: { nome: 'asc' },
      include: { alunos: { select: { id: true, nome: true, email: true, serie: true }, orderBy: { nome: 'asc' } } },
    });
  }

  async create(nome: string, escolaId: number) {
    try {
      return await this.prisma.turma.create({ data: { nome: this.nomeValido(nome), escolaId } });
    } catch (e) {
      throw this.traduzir(e);
    }
  }

  async update(id: number, nome: string, escolaId: number) {
    await this.garantir(id, escolaId);
    try {
      return await this.prisma.turma.update({ where: { id }, data: { nome: this.nomeValido(nome) } });
    } catch (e) {
      throw this.traduzir(e);
    }
  }

  async remove(id: number, escolaId: number) {
    await this.garantir(id, escolaId);
    await this.prisma.aluno.updateMany({ where: { turmaId: id, escolaId }, data: { turmaId: null } });
    return this.prisma.turma.delete({ where: { id } });
  }

  private traduzir(e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return new ConflictException('Já existe uma turma com esse nome.');
    }
    return e;
  }
}
