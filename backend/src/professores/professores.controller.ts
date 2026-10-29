import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Delete, UseGuards } from '@nestjs/common';
import { ProfessoresService } from './professores.service';
import { CreateProfessoreDto } from './dto/create-professore.dto';
import { UpdateProfessoreDto } from './dto/update-professore.dto';
import { AdminGuard } from '../auth/admin.guard';
import { EscolaAtual } from '../auth/auth-user';

@Controller('professores')
export class ProfessoresController {
  constructor(private readonly professoresService: ProfessoresService) {}

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createProfessoreDto: CreateProfessoreDto, @EscolaAtual() escolaId: number) {
    return this.professoresService.create(createProfessoreDto, escolaId);
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll(@EscolaAtual() escolaId: number) {
    return this.professoresService.findAll(escolaId);
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.professoresService.findOne(id, escolaId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProfessoreDto: UpdateProfessoreDto,
    @EscolaAtual() escolaId: number,
  ) {
    return this.professoresService.update(id, updateProfessoreDto, escolaId);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @EscolaAtual() escolaId: number) {
    return this.professoresService.remove(id, escolaId);
  }
}
