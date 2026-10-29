jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlunosService } from './alunos.service';

describe('AlunosService (por escola)', () => {
  const prisma = {
    aluno: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    turma: { findFirst: jest.fn() },
  };
  const service = new AlunosService(prisma as any);

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
});
