import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import type { FiltrosRelatorio } from './relatorios.service';
import { AdminGuard } from '../auth/admin.guard';
import { EscolaAtual } from '../auth/auth-user';

@UseGuards(AdminGuard)
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get()
  resumo(@EscolaAtual() escolaId: number, @Query() filtros: FiltrosRelatorio) {
    return this.relatoriosService.resumo(escolaId, filtros);
  }
}
