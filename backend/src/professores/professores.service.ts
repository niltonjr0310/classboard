import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessoreDto } from './dto/create-professore.dto';
import { UpdateProfessoreDto } from './dto/update-professore.dto';

@Injectable()
export class ProfessoresService {
  constructor(private prisma: PrismaService) {}

  create(createProfessoreDto: CreateProfessoreDto) {
    return this.prisma.professor.create({ data: createProfessoreDto });
  }

  findAll() {
    return this.prisma.professor.findMany();
  }

  findOne(id: number) {
    return this.prisma.professor.findUnique({ where: { id } });
  }

  update(id: number, updateProfessoreDto: UpdateProfessoreDto) {
    return this.prisma.professor.update({
      where: { id },
      data: updateProfessoreDto,
    });
  }

  remove(id: number) {
    return this.prisma.professor.delete({ where: { id } });
  }
}