import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Delete, UseGuards } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { AdminGuard } from '../auth/admin.guard';
import { EscolaAtual } from '../auth/auth-user';

@Controller('alunos')
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createAlunoDto: CreateAlunoDto, @EscolaAtual() escolaId: number) {
    return this.alunosService.create(createAlunoDto, escolaId);
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll(@EscolaAtual() escolaId: number) {
    return this.alunosService.findAll(escolaId);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.alunosService.findOne(id, escolaId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlunoDto: UpdateAlunoDto,
    @EscolaAtual() escolaId: number,
  ) {
    return this.alunosService.update(id, updateAlunoDto, escolaId);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.alunosService.remove(id, escolaId);
  }
}
