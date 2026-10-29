import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { AdminGuard } from '../auth/admin.guard';
import { NomeTurmaDto } from './dto/nome-turma.dto';
import { EscolaAtual } from '../auth/auth-user';

@UseGuards(AdminGuard)
@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Get()
  findAll(@EscolaAtual() escolaId: number) {
    return this.turmasService.findAll(escolaId);
  }

  @Post()
  create(@Body() body: NomeTurmaDto, @EscolaAtual() escolaId: number) {
    return this.turmasService.create(body.nome, escolaId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: NomeTurmaDto,
    @EscolaAtual() escolaId: number,
  ) {
    return this.turmasService.update(id, body.nome, escolaId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.turmasService.remove(id, escolaId);
  }
}
