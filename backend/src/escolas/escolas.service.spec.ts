jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EscolasService } from './escolas.service';

describe('EscolasService', () => {
  const prisma = {
    escola: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    admin: { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
    professor: { findFirst: jest.fn(), count: jest.fn() },
    aluno: { findFirst: jest.fn(), count: jest.fn() },
    aula: { count: jest.fn() },
    turma: { count: jest.fn() },
  };
  const service = new EscolasService(prisma as any);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.admin.findFirst.mockResolvedValue(null);
    prisma.professor.findFirst.mockResolvedValue(null);
    prisma.aluno.findFirst.mockResolvedValue(null);
  });

  it('exige nome para criar a escola', async () => {
    await expect(service.create({ nome: '   ' })).rejects.toThrow(BadRequestException);
  });

  it('só aceita logo http(s)', async () => {
    await expect(service.create({ nome: 'X', logoUrl: 'javascript:alert(1)' })).rejects.toThrow(BadRequestException);
    prisma.escola.create.mockResolvedValue({ id: 1 });
    await service.create({ nome: 'X', logoUrl: 'https://exemplo.com/a.png' });
    expect(prisma.escola.create.mock.calls[0][0].data.logoUrl).toBe('https://exemplo.com/a.png');
  });

  it('cria o admin junto, com e-mail em minúsculas', async () => {
    prisma.escola.create.mockResolvedValue({ id: 1 });
    await service.create({ nome: 'X', adminEmail: ' Diretor@Escola.com ' });
    const data = prisma.escola.create.mock.calls[0][0].data;
    expect(data.admins.create.email).toBe('diretor@escola.com');
  });

  it('recusa e-mail de admin que já existe como professor', async () => {
    prisma.professor.findFirst.mockResolvedValue({ id: 1 });
    await expect(service.create({ nome: 'X', adminEmail: 'p@escola.com' })).rejects.toThrow(ConflictException);
    expect(prisma.escola.create).not.toHaveBeenCalled();
  });

  it('não exclui escola que ainda tem dados', async () => {
    prisma.escola.findUnique.mockResolvedValue({ id: 1 });
    prisma.aluno.count.mockResolvedValue(2);
    prisma.professor.count.mockResolvedValue(0);
    prisma.aula.count.mockResolvedValue(0);
    prisma.turma.count.mockResolvedValue(0);
    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(prisma.escola.delete).not.toHaveBeenCalled();
  });

  it('exclui escola vazia junto com os admins dela', async () => {
    prisma.escola.findUnique.mockResolvedValue({ id: 1 });
    prisma.aluno.count.mockResolvedValue(0);
    prisma.professor.count.mockResolvedValue(0);
    prisma.aula.count.mockResolvedValue(0);
    prisma.turma.count.mockResolvedValue(0);
    await service.remove(1);
    expect(prisma.admin.deleteMany).toHaveBeenCalledWith({ where: { escolaId: 1 } });
    expect(prisma.escola.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('remover admin de outra escola dá 404', async () => {
    prisma.admin.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.removeAdmin(1, 9)).rejects.toThrow(NotFoundException);
    expect(prisma.admin.deleteMany).toHaveBeenCalledWith({ where: { id: 9, escolaId: 1 } });
  });
});
