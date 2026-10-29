import { IsString, MaxLength } from 'class-validator';

/** O serviço confere se o nome não está vazio e devolve a mensagem certa. */
export class NomeTurmaDto {
  @IsString()
  @MaxLength(60)
  nome: string;
}
