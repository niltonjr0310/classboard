jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { ConflictException } from '@nestjs/common';
import { garantirEmailLivre } from './email-livre';

describe('garantirEmailLivre', () => {
  const prisma = {
    admin: { findFirst: jest.fn() },
    professor: { findFirst: jest.fn() },
    aluno: { findFirst: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.ADMIN_EMAILS = 'dono@exemplo.com';
  });

  it('passa quando ninguém usa o e-mail', async () => {
    await expect(garantirEmailLivre(prisma as any, 'novo@escola.com')).resolves.toBeUndefined();
  });

  it.each(['admin', 'professor', 'aluno'] as const)('recusa e-mail já usado por %s', async (tabela) => {
    prisma[tabela].findFirst.mockResolvedValue({ id: 1 });
    await expect(garantirEmailLivre(prisma as any, 'x@escola.com')).rejects.toThrow(ConflictException);
  });

  it('recusa o e-mail do dono do sistema', async () => {
    await expect(garantirEmailLivre(prisma as any, 'DONO@exemplo.com')).rejects.toThrow(ConflictException);
  });

  it('ao editar, procura só entre os outros registros da mesma tabela', async () => {
    await garantirEmailLivre(prisma as any, 'x@escola.com', { tipo: 'professor', id: 7 });
    expect(prisma.professor.findFirst.mock.calls[0][0].where.id).toEqual({ not: 7 });
    expect(prisma.aluno.findFirst.mock.calls[0][0].where.id).toBeUndefined();
  });
});
