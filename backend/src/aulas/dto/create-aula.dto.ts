export class CreateAulaDto {
  dataHora: string;
  duracao: number;
  status?: string;
  tipo?: string; // "aula" ou "prova"
  materia?: string;
  professorId: number;
  alunoId: number;
}
