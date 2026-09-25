import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';

@Injectable()
export class AulasService {
  constructor(private prisma: PrismaService) {}

  create(createAulaDto: CreateAulaDto) {
    return this.prisma.aula.create({
      data: {
        ...createAulaDto,
        dataHora: new Date(createAulaDto.dataHora),
      },
    });
  }

  findAll() {
    return this.prisma.aula.findMany({
      include: { professor: true, aluno: true },
    });
  }

  findOne(id: number) {
    return this.prisma.aula.findUnique({
      where: { id },
      include: { professor: true, aluno: true },
    });
  }

  update(id: number, updateAulaDto: UpdateAulaDto) {
    const data: any = { ...updateAulaDto };
    if (data.dataHora) {
      data.dataHora = new Date(data.dataHora);
    }
    return this.prisma.aula.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.aula.delete({ where: { id } });
  }
}