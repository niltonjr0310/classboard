jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProfessoresService } from './professores.service';

describe('ProfessoresService (por escola)', () => {
  const prisma = {
    professor: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
    admin: { findFirst: jest.fn() },
    aluno: { findFirst: jest.fn() },
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

  it('guarda o e-mail em minúsculas', async () => {
    await service.create({ nome: 'A', email: ' Prof@Escola.COM ', disciplina: 'Mat' } as any, 3);
    expect(prisma.professor.create.mock.calls[0][0].data.email).toBe('prof@escola.com');
  });

  it('recusa e-mail que já é de um aluno', async () => {
    prisma.aluno.findFirst.mockResolvedValue({ id: 9 });
    await expect(
      service.create({ nome: 'A', email: 'aluno@escola.com', disciplina: 'Mat' } as any, 3),
    ).rejects.toThrow(ConflictException);
    expect(prisma.professor.create).not.toHaveBeenCalled();
  });

  it('ao editar, ignora o próprio professor na checagem de e-mail repetido', async () => {
    prisma.professor.findFirst.mockResolvedValueOnce({ id: 1 }); // só a busca do próprio registro
    await service.update(1, { email: 'mesmo@escola.com' }, 3);
    const where = prisma.professor.findFirst.mock.calls[1][0].where;
    expect(where.id).toEqual({ not: 1 });
  });

  it('traduz e-mail repetido do banco (P2002) em 409', async () => {
    prisma.professor.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create({ nome: 'A', email: 'a@a.com', disciplina: 'Mat' } as any, 3),
    ).rejects.toThrow(ConflictException);
  });
});
