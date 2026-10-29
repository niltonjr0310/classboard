import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/dto-utils';

export class CreateAulaDto {
  @IsISO8601()
  dataHora: string;

  @IsInt()
  @Min(1)
  @Max(600)
  duracao: number;

  @IsOptional()
  @IsIn(['agendada', 'concluida', 'cancelada'])
  status?: string;

  @IsOptional()
  @IsIn(['aula', 'prova'])
  tipo?: string; // "aula" ou "prova"

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(80)
  materia?: string;

  @IsInt()
  @Min(1)
  professorId: number;

  @IsInt()
  @Min(1)
  alunoId: number;
}
