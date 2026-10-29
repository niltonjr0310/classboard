import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@Injectable()
export class AlunosService {
  constructor(private prisma: PrismaService) {}

  /** Só campos permitidos: o cliente nunca define escolaId. */
  private async dados(dto: UpdateAlunoDto, escolaId: number) {
    const data: { nome?: string; email?: string; serie?: string; turmaId?: number | null } = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
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
    return this.prisma.aluno.create({
      data: { nome: dto.nome, email: dto.email, serie: dto.serie, ...data, escolaId },
    });
  }

  findAll(escolaId: number) {
    return this.prisma.aluno.findMany({
      where: { escolaId },
      include: { turma: { select: { id: true, nome: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  findOne(id: number, escolaId: number) {
    return this.garantir(id, escolaId);
  }

  async update(id: number, dto: UpdateAlunoDto, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.aluno.update({ where: { id }, data: await this.dados(dto, escolaId) });
  }

  async remove(id: number, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.aluno.delete({ where: { id } });
  }
}
