import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AulasService } from './aulas.service';
import { CreateAulaDto } from './dto/create-aula.dto';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AuthUser, EscolaAtual } from '../auth/auth-user';

type RequestComUsuario = Request & { user: AuthUser };

@Controller('aulas')
export class AulasController {
  constructor(private readonly aulasService: AulasService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createAulaDto: CreateAulaDto, @EscolaAtual() escolaId: number) {
    return this.aulasService.create(createAulaDto, escolaId);
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll(@EscolaAtual() escolaId: number) {
    return this.aulasService.findAll(escolaId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('minhas')
  findMinhas(@Req() req: RequestComUsuario) {
    const escolaId = req.user.escolaId;
    if (!escolaId) return [];
    if (req.user.role === 'PROFESSOR') {
      return this.aulasService.findByProfessor(req.user.sub, escolaId);
    }
    if (req.user.role === 'ALUNO') {
      return this.aulasService.findByAluno(req.user.sub, escolaId);
    }
    return [];
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.aulasService.findOne(id, escolaId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAulaDto: UpdateAulaDto,
    @EscolaAtual() escolaId: number,
  ) {
    return this.aulasService.update(id, updateAulaDto, escolaId);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.aulasService.remove(id, escolaId);
  }
}
