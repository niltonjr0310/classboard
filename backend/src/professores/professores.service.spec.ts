jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { NotFoundException } from '@nestjs/common';
import { ProfessoresService } from './professores.service';

describe('ProfessoresService (por escola)', () => {
  const prisma = {
    professor: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const service = new ProfessoresService(prisma as any);

  beforeEach(() => jest.resetAllMocks());

  it('cria sempre na escola do usuário', async () => {
    await service.create({ nome: 'A', email: 'a@a.com', disciplina: 'Mat', escolaId: 99 } as any, 3);
    expect(prisma.professor.create.mock.calls[0][0].data.escolaId).toBe(3);
  });

  it('lista só os professores da escola', async () => {
    await service.findAll(3);
    expect(prisma.professor.findMany.mock.calls[0][0].where).toEqual({ escolaId: 3 });
  });

  it('não acha, altera nem remove professor de outra escola', async () => {
    prisma.professor.findFirst.mockResolvedValue(null);
    await expect(service.findOne(1, 3)).rejects.toThrow(NotFoundException);
    await expect(service.update(1, { nome: 'X' }, 3)).rejects.toThrow(NotFoundException);
    await expect(service.remove(1, 3)).rejects.toThrow(NotFoundException);
    expect(prisma.professor.delete).not.toHaveBeenCalled();
  });

  it('atualiza só campos permitidos', async () => {
    prisma.professor.findFirst.mockResolvedValue({ id: 1 });
    await service.update(1, { nome: 'B', escolaId: 50 } as any, 3);
    expect(prisma.professor.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { nome: 'B' } });
  });
});
