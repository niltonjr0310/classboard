jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TurmasService } from './turmas.service';

describe('TurmasService', () => {
  const prisma = {
    turma: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
    aluno: { updateMany: jest.fn() },
  };
  const service = new TurmasService(prisma as any);

  beforeEach(() => jest.resetAllMocks());

  it('cria na escola do usuário e exige nome', async () => {
    await expect(service.create('  ', 1)).rejects.toThrow(BadRequestException);
    await service.create(' 9º A ', 1);
    expect(prisma.turma.create).toHaveBeenCalledWith({ data: { nome: '9º A', escolaId: 1 } });
  });

  it('traduz nome repetido em 409', async () => {
    prisma.turma.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create('9A', 1)).rejects.toThrow(ConflictException);
  });

  it('não mexe em turma de outra escola', async () => {
    prisma.turma.findFirst.mockResolvedValue(null);
    await expect(service.update(1, 'X', 2)).rejects.toThrow(NotFoundException);
    await expect(service.remove(1, 2)).rejects.toThrow(NotFoundException);
    expect(prisma.turma.delete).not.toHaveBeenCalled();
  });

  it('ao excluir, solta os alunos da turma', async () => {
    prisma.turma.findFirst.mockResolvedValue({ id: 1 });
    await service.remove(1, 2);
    expect(prisma.aluno.updateMany).toHaveBeenCalledWith({ where: { turmaId: 1, escolaId: 2 }, data: { turmaId: null } });
    expect(prisma.turma.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
