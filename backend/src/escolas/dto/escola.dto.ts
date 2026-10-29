import { IsEmail, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { Minusculas } from '../../common/dto-utils';

/** Campos de texto são conferidos no serviço (mensagens em português). Aqui só limitamos tipo e tamanho. */
export class CriarEscolaDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;

  @ValidateIf((o: CriarEscolaDto) => Boolean(o.adminEmail))
  @Minusculas()
  @IsEmail()
  @MaxLength(254)
  adminEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  adminNome?: string;
}

export class AtualizarEscolaDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;
}

export class NovoAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome?: string;

  @Minusculas()
  @IsEmail()
  @MaxLength(254)
  email: string;
}
