import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { EscolasService } from './escolas.service';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, EscolaAtual } from '../auth/auth-user';
import { AtualizarEscolaDto, CriarEscolaDto, NovoAdminDto } from './dto/escola.dto';

@Controller('escolas')
export class EscolasController {
  constructor(private readonly escolasService: EscolasService) {}

  // ---- qualquer usuário logado / admin da escola (rotas fixas antes das com :id) ----

  @UseGuards(JwtAuthGuard)
  @Get('minha')
  minha(@Req() req: Request & { user: AuthUser }) {
    if (!req.user.escolaId) return null;
    return this.escolasService.findOne(req.user.escolaId);
  }

  @UseGuards(AdminGuard)
  @Patch('minha')
  atualizarMinha(
    @EscolaAtual() escolaId: number,
    @Body() body: AtualizarEscolaDto,
  ) {
    return this.escolasService.update(escolaId, body);
  }

  // ---- só o dono do sistema ----

  @UseGuards(SuperAdminGuard)
  @Get()
  findAll() {
    return this.escolasService.findAll();
  }

  @UseGuards(SuperAdminGuard)
  @Post()
  create(@Body() body: CriarEscolaDto) {
    return this.escolasService.create(body);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: AtualizarEscolaDto) {
    return this.escolasService.update(id, body);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.escolasService.remove(id);
  }

  @UseGuards(SuperAdminGuard)
  @Get(':id/admins')
  listAdmins(@Param('id', ParseIntPipe) id: number) {
    return this.escolasService.listAdmins(id);
  }

  @UseGuards(SuperAdminGuard)
  @Post(':id/admins')
  addAdmin(@Param('id', ParseIntPipe) id: number, @Body() body: NovoAdminDto) {
    return this.escolasService.addAdmin(id, body);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':id/admins/:adminId')
  removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Param('adminId', ParseIntPipe) adminId: number,
  ) {
    return this.escolasService.removeAdmin(id, adminId);
  }
}
