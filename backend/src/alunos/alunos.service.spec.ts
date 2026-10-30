jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AlunosService } from './alunos.service';

describe('AlunosService (por escola)', () => {
  const prisma = {
    aluno: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    turma: { findFirst: jest.fn() },
    admin: { findFirst: jest.fn() },
    professor: { findFirst: jest.fn() },
    escola: { findUnique: jest.fn() },
    aula: { findMany: jest.fn(), deleteMany: jest.fn() },
    notificacao: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const email = { enviar: jest.fn().mockResolvedValue(undefined) };
  const service = new AlunosService(prisma as any, email as any);

  beforeEach(() => jest.resetAllMocks());

  it('cria sempre na escola do usuário, ignorando escolaId vindo do cliente', async () => {
    await service.create({ nome: 'A', email: 'a@a.com', serie: '1', escolaId: 99 } as any, 3);
    expect(prisma.aluno.create.mock.calls[0][0].data.escolaId).toBe(3);
  });

  it('lista só os alunos da escola', async () => {
    await service.findAll(3);
    expect(prisma.aluno.findMany.mock.calls[0][0].where).toEqual({ escolaId: 3 });
  });

  it('não acha, altera nem remove aluno de outra escola', async () => {
    prisma.aluno.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 3)).rejects.toThrow(NotFoundException);
    await expect(service.update(1, { nome: 'X' }, 3)).rejects.toThrow(NotFoundException);
    await expect(service.remove(1, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.aluno.update).not.toHaveBeenCalled();
    expect(prisma.aluno.delete).not.toHaveBeenCalled();
  });

  it('só vincula a turma da própria escola', async () => {
    prisma.aluno.findFirst.mockResolvedValue({ id: 1 });
    prisma.turma.findFirst.mockResolvedValue(null);
    await expect(service.update(1, { turmaId: 8 }, 3)).rejects.toThrow(BadRequestException);
    expect(prisma.turma.findFirst).toHaveBeenCalledWith({ where: { id: 8, escolaId: 3 } });
  });

  it('aceita tirar o aluno da turma (turmaId null)', async () => {
    prisma.aluno.findFirst.mockResolvedValue({ id: 1 });
    await service.update(1, { turmaId: null }, 3);
    expect(prisma.aluno.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { turmaId: null } });
  });

  it('guarda o e-mail em minúsculas', async () => {
    await service.create({ nome: 'A', email: ' Ana@Escola.COM ', serie: '1' } as any, 3);
    expect(prisma.aluno.create.mock.calls[0][0].data.email).toBe('ana@escola.com');
  });

  it('recusa e-mail que já é de um professor', async () => {
    prisma.professor.findFirst.mockResolvedValue({ id: 5 });
    await expect(service.create({ nome: 'A', email: 'prof@escola.com', serie: '1' } as any, 3)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.aluno.create).not.toHaveBeenCalled();
  });

  it('ao editar, ignora o próprio aluno na checagem de e-mail repetido', async () => {
    prisma.aluno.findFirst.mockResolvedValueOnce({ id: 1 }); // só a busca do próprio registro
    await service.update(1, { email: 'mesmo@escola.com' }, 3);
    const where = prisma.aluno.findFirst.mock.calls[1][0].where;
    expect(where.id).toEqual({ not: 1 });
  });

  it('traduz e-mail repetido do banco (P2002) em 409', async () => {
    prisma.aluno.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create({ nome: 'A', email: 'a@a.com', serie: '1' } as any, 3)).rejects.toThrow(
      ConflictException,
    );
  });

  describe('consentimento do responsável', () => {
    const aluno = { id: 5, nome: 'Beto', escolaId: 3, responsavelEmail: 'mae@x.com', responsavelNome: 'Maria', consentimentoEm: null };

    it('ao cadastrar com e-mail do responsável, envia o link e não devolve o token', async () => {
      prisma.aluno.create.mockResolvedValue(aluno);
      prisma.aluno.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(aluno);
      prisma.aluno.update.mockResolvedValue({ ...aluno, consentimentoToken: 'segredo' });
      prisma.escola.findUnique.mockResolvedValue({ nome: 'Colégio' });
      const r: any = await service.create(
        { nome: 'Beto', email: 'b@b.com', serie: '1', responsavelEmail: 'mae@x.com' } as any,
        3,
      );
      expect(email.enviar).toHaveBeenCalledTimes(1);
      expect(email.enviar.mock.calls[0][0]).toBe('mae@x.com');
      expect(email.enviar.mock.calls[0][2]).toMatch(/\/consentimento\/[a-f0-9]{64}/);
      expect(r).not.toHaveProperty('consentimentoToken');
    });

    it('sem responsável não envia nada', async () => {
      prisma.aluno.create.mockResolvedValue({ id: 6, nome: 'X' });
      await service.create({ nome: 'X', email: 'x@x.com', serie: '1' } as any, 3);
      expect(email.enviar).not.toHaveBeenCalled();
    });

    it('rejeita token inválido e desconhecido', async () => {
      await expect(service.consultarConsentimento('abc')).rejects.toThrow(NotFoundException);
      prisma.aluno.findUnique = jest.fn().mockResolvedValue(null);
      await expect(service.autorizarConsentimento('a'.repeat(64))).rejects.toThrow(NotFoundException);
    });

    it('autoriza uma vez e recusa link expirado', async () => {
      const t = 'a'.repeat(64);
      prisma.aluno.findUnique = jest.fn().mockResolvedValue({
        ...aluno, escola: { nome: 'C' }, consentimentoEnviadoEm: new Date(),
      });
      prisma.aluno.update.mockResolvedValue({ consentimentoEm: new Date() });
      const r = await service.autorizarConsentimento(t);
      expect(r.autorizadoEm).toBeInstanceOf(Date);

      prisma.aluno.findUnique = jest.fn().mockResolvedValue({
        ...aluno, escola: { nome: 'C' }, consentimentoEnviadoEm: new Date(Date.now() - 31 * 86400000),
      });
      await expect(service.autorizarConsentimento(t)).rejects.toThrow(BadRequestException);
    });
  });

  it('ao excluir, apaga aulas e avisos do aluno junto, numa transação', async () => {
    prisma.aluno.findFirst.mockResolvedValue({ id: 5, nome: 'Beto', escolaId: 3 });
    prisma.aula.findMany.mockResolvedValue([{ professorId: 9 }, { professorId: 9 }]);
    prisma.$transaction.mockResolvedValue([{}, {}, {}, { id: 5 }]);
    const r = await service.remove(5, 3);
    expect(prisma.aula.deleteMany).toHaveBeenCalledWith({ where: { alunoId: 5, escolaId: 3 } });
    expect(prisma.notificacao.deleteMany).toHaveBeenCalledTimes(2);
    expect(prisma.aluno.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ id: 5 });
  });
});
