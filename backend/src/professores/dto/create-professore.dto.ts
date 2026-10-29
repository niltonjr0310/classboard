import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Minusculas, Trim } from '../../common/dto-utils';

export class CreateProfessoreDto {
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
  @MaxLength(80)
  disciplina: string;
}
