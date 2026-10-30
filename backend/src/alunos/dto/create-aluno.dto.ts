import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Minusculas, Trim } from '../../common/dto-utils';

export class CreateAlunoDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @Minusculas()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  serie: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  turmaId?: number | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  responsavelNome?: string | null;

  @IsOptional()
  @Minusculas()
  @IsEmail()
  @MaxLength(254)
  responsavelEmail?: string | null;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(30)
  responsavelTelefone?: string | null;
}
