import { Controller, Get, Patch, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type RequestComUsuario = Request & { user: { sub: number; role: 'ALUNO' | 'PROFESSOR' | 'ADMIN' } };

@UseGuards(JwtAuthGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get('minhas')
  async minhas(@Req() req: RequestComUsuario) {
    if (req.user.role === 'ADMIN') {
      return { lista: [], naoLidas: 0 };
    }
    const role = req.user.role;
    const [lista, naoLidas] = await Promise.all([
      this.notificacoesService.findMinhas(role, req.user.sub),
      this.notificacoesService.contarNaoLidas(role, req.user.sub),
    ]);
    return { lista, naoLidas };
  }

  @Patch(':id/lida')
  async marcarLida(@Param('id', ParseIntPipe) id: number, @Req() req: RequestComUsuario) {
    if (req.user.role === 'ADMIN') return { count: 0 };
    return this.notificacoesService.marcarLida(id, req.user.role, req.user.sub);
  }

  @Patch('todas/lidas')
  async marcarTodasLidas(@Req() req: RequestComUsuario) {
    if (req.user.role === 'ADMIN') return { count: 0 };
    return this.notificacoesService.marcarTodasLidas(req.user.role, req.user.sub);
  }
}
