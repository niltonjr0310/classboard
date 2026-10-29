import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessoreDto } from './dto/create-professore.dto';
import { UpdateProfessoreDto } from './dto/update-professore.dto';
import { garantirEmailLivre } from '../auth/email-livre';

@Injectable()
export class ProfessoresService {
  constructor(private prisma: PrismaService) {}

  /** Só campos permitidos: o cliente nunca define escolaId. */
  private async dados(dto: UpdateProfessoreDto, proprioId?: number) {
    const data: { nome?: string; email?: string; disciplina?: string } = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      await garantirEmailLivre(
        this.prisma,
        email,
        proprioId ? { tipo: 'professor', id: proprioId } : undefined,
      );
      data.email = email;
    }
    if (dto.disciplina !== undefined) data.disciplina = dto.disciplina;
    return data;
  }

  private async garantir(id: number, escolaId: number) {
    const professor = await this.prisma.professor.findFirst({ where: { id, escolaId } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');
    return professor;
  }

  async create(dto: CreateProfessoreDto, escolaId: number) {
    const data = await this.dados(dto);
    try {
      return await this.prisma.professor.create({
        data: { nome: dto.nome, email: dto.email, disciplina: dto.disciplina, ...data, escolaId },
      });
    } catch (e) {
      throw this.traduzir(e);
    }
  }

  findAll(escolaId: number) {
    return this.prisma.professor.findMany({ where: { escolaId }, orderBy: { nome: 'asc' } });
  }

  findOne(id: number, escolaId: number) {
    return this.garantir(id, escolaId);
  }

  async update(id: number, dto: UpdateProfessoreDto, escolaId: number) {
    await this.garantir(id, escolaId);
    const data = await this.dados(dto, id);
    try {
      return await this.prisma.professor.update({ where: { id }, data });
    } catch (e) {
      throw this.traduzir(e);
    }
  }

  async remove(id: number, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.professor.delete({ where: { id } });
  }

  private traduzir(e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      return new ConflictException('Esse e-mail já está cadastrado no ClassBoard.');
    }
    return e;
  }
}
