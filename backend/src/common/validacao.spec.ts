import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateAlunoDto } from '../alunos/dto/create-aluno.dto';
import { UpdateAlunoDto } from '../alunos/dto/update-aluno.dto';
import { CreateAulaDto } from '../aulas/dto/create-aula.dto';
import { UpdateAulaDto } from '../aulas/dto/update-aula.dto';
import { CreateProfessoreDto } from '../professores/dto/create-professore.dto';
import { CriarEscolaDto } from '../escolas/dto/escola.dto';
import { NomeTurmaDto } from '../turmas/dto/nome-turma.dto';

// mesma configuração do main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (erros) =>
    new BadRequestException(`Dados inválidos: ${erros.map((e) => e.property).join(', ')}.`),
});

const validar = (metatype: any, value: unknown) => pipe.transform(value, { type: 'body', metatype });

describe('validação da entrada (ValidationPipe + DTOs)', () => {
  const aula = { dataHora: '2026-11-10T17:00:00.000Z', duracao: 60, professorId: 1, alunoId: 2 };

  it('aceita uma aula válida e descarta campos desconhecidos (ex.: escolaId)', async () => {
    const r: any = await validar(CreateAulaDto, { ...aula, escolaId: 99, tipo: 'prova', materia: ' Mat ' });
    expect(r.escolaId).toBeUndefined();
    expect(r.materia).toBe('Mat');
  });

  it.each([
    ['duração negativa', { duracao: -5 }],
    ['duração zero', { duracao: 0 }],
    ['duração gigante', { duracao: 100000 }],
    ['data inválida', { dataHora: 'amanhã' }],
    ['status inventado', { status: 'qualquer-coisa' }],
    ['tipo inventado', { tipo: 'passeio' }],
    ['professor não numérico', { professorId: 'abc' }],
  ])('recusa aula com %s', async (_nome, extra) => {
    await expect(validar(CreateAulaDto, { ...aula, ...extra })).rejects.toThrow(BadRequestException);
  });

  it('na edição da aula, todos os campos são opcionais mas continuam validados', async () => {
    await expect(validar(UpdateAulaDto, { status: 'concluida' })).resolves.toBeDefined();
    await expect(validar(UpdateAulaDto, { duracao: -1 })).rejects.toThrow(BadRequestException);
  });

  it('aluno: normaliza o e-mail e exige nome, e-mail válido e série', async () => {
    const r: any = await validar(CreateAlunoDto, { nome: ' Ana ', email: ' ANA@Escola.com ', serie: '9º A' });
    expect(r.nome).toBe('Ana');
    expect(r.email).toBe('ana@escola.com');
    await expect(validar(CreateAlunoDto, { nome: '', email: 'a@a.com', serie: '1' })).rejects.toThrow(BadRequestException);
    await expect(validar(CreateAlunoDto, { nome: 'A', email: 'nao-e-email', serie: '1' })).rejects.toThrow(BadRequestException);
    await expect(validar(CreateAlunoDto, { nome: 'A', email: 'a@a.com' })).rejects.toThrow(BadRequestException);
  });

  it('aluno: turmaId aceita número ou null, mas não texto', async () => {
    const base = { nome: 'A', email: 'a@a.com', serie: '1' };
    await expect(validar(CreateAlunoDto, { ...base, turmaId: 3 })).resolves.toBeDefined();
    await expect(validar(UpdateAlunoDto, { turmaId: null })).resolves.toBeDefined();
    await expect(validar(CreateAlunoDto, { ...base, turmaId: 'x' })).rejects.toThrow(BadRequestException);
  });

  it('professor: exige nome, e-mail válido e disciplina', async () => {
    await expect(validar(CreateProfessoreDto, { nome: 'P', email: 'p@escola.com', disciplina: 'Mat' })).resolves.toBeDefined();
    await expect(validar(CreateProfessoreDto, { nome: 'P', email: 'x', disciplina: 'Mat' })).rejects.toThrow(BadRequestException);
  });

  it('escola: aceita admin e logo vazios (formulário em branco)', async () => {
    await expect(validar(CriarEscolaDto, { nome: 'Colégio', adminEmail: '', logoUrl: '' })).resolves.toBeDefined();
    await expect(validar(CriarEscolaDto, { nome: 'Colégio', adminEmail: 'xx' })).rejects.toThrow(BadRequestException);
  });

  it('turma: nome precisa ser texto', async () => {
    await expect(validar(NomeTurmaDto, { nome: '9º A' })).resolves.toBeDefined();
    await expect(validar(NomeTurmaDto, { nome: 123 })).rejects.toThrow(BadRequestException);
  });
});
