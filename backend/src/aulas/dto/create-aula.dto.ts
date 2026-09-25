export class CreateAulaDto {
  dataHora: string;
  duracao: number;
  status?: string;
  professorId: number;
  alunoId: number;
}