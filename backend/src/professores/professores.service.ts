import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessoreDto } from './dto/create-professore.dto';
import { UpdateProfessoreDto } from './dto/update-professore.dto';

@Injectable()
export class ProfessoresService {
  constructor(private prisma: PrismaService) {}

  /** Só campos permitidos: o cliente nunca define escolaId. */
  private dados(dto: UpdateProfessoreDto) {
    const data: { nome?: string; email?: string; disciplina?: string } = {};
    if (dto.nome !== undefined) data.nome = dto.nome;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.disciplina !== undefined) data.disciplina = dto.disciplina;
    return data;
  }

  private async garantir(id: number, escolaId: number) {
    const professor = await this.prisma.professor.findFirst({ where: { id, escolaId } });
    if (!professor) throw new NotFoundException('Professor não encontrado.');
    return professor;
  }

  create(dto: CreateProfessoreDto, escolaId: number) {
    return this.prisma.professor.create({
      data: { nome: dto.nome, email: dto.email, disciplina: dto.disciplina, escolaId },
    });
  }

  findAll(escolaId: number) {
    return this.prisma.professor.findMany({ where: { escolaId }, orderBy: { nome: 'asc' } });
  }

  findOne(id: number, escolaId: number) {
    return this.garantir(id, escolaId);
  }

  async update(id: number, dto: UpdateProfessoreDto, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.professor.update({ where: { id }, data: this.dados(dto) });
  }

  async remove(id: number, escolaId: number) {
    await this.garantir(id, escolaId);
    return this.prisma.professor.delete({ where: { id } });
  }
}
