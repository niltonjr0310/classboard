jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

function contexto(authorization?: string, extras: Record<string, string> = {}) {
  const request: any = { headers: { ...(authorization ? { authorization } : {}), ...extras } };
  const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;
  return { ctx, request };
}

function novoPrisma() {
  return {
    escola: { findUnique: jest.fn() },
    admin: { findFirst: jest.fn() },
    professor: { findFirst: jest.fn() },
    aluno: { findFirst: jest.fn() },
  };
}

const DONO = 'dono@exemplo.com';

beforeAll(() => {
  process.env.ADMIN_EMAILS = DONO;
});

describe('AdminGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const prisma = novoPrisma();
  const guard = new AdminGuard(jwt as any, prisma as any);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.admin.findFirst.mockResolvedValue({ id: 2 });
  });

  it('bloqueia sem token', async () => {
    await expect(guard.canActivate(contexto().ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('bloqueia token inválido', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('expirado'));
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(UnauthorizedException);
  });

  it.each(['ALUNO', 'PROFESSOR'])('bloqueia %s com 403', async (role) => {
    jwt.verifyAsync.mockResolvedValue({ sub: 1, role, escolaId: 1 });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(ForbiddenException);
  });

  it('libera ADMIN com a escola do token e ignora o cabeçalho x-escola-id', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 2, role: 'ADMIN', escolaId: 1 });
    const { ctx, request } = contexto('Bearer x', { 'x-escola-id': '99' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user.escolaId).toBe(1);
    expect(prisma.escola.findUnique).not.toHaveBeenCalled();
  });

  it('ADMIN removido da escola perde o acesso na hora, mesmo com token válido', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 2, role: 'ADMIN', escolaId: 1 });
    prisma.admin.findFirst.mockResolvedValue(null);
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(UnauthorizedException);
    expect(prisma.admin.findFirst).toHaveBeenCalledWith({
      where: { id: 2, escolaId: 1 },
      select: { id: true },
    });
  });

  it('SUPERADMIN usa a escola do cabeçalho quando ela existe', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN', email: DONO });
    prisma.escola.findUnique.mockResolvedValue({ id: 4 });
    const { ctx, request } = contexto('Bearer x', { 'x-escola-id': '4' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user.escolaId).toBe(4);
  });

  it('SUPERADMIN fica sem escola se o cabeçalho falta ou a escola não existe', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN', email: DONO });
    const sem = contexto('Bearer x');
    await guard.canActivate(sem.ctx);
    expect(sem.request.user.escolaId).toBeUndefined();

    prisma.escola.findUnique.mockResolvedValue(null);
    const inexistente = contexto('Bearer x', { 'x-escola-id': '123' });
    await guard.canActivate(inexistente.ctx);
    expect(inexistente.request.user.escolaId).toBeUndefined();
  });

  it('SUPERADMIN cujo e-mail saiu da lista perde o acesso', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN', email: 'outro@exemplo.com' });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(UnauthorizedException);
  });
});

describe('SuperAdminGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const guard = new SuperAdminGuard(jwt as any);

  beforeEach(() => jest.resetAllMocks());

  it('bloqueia sem token', async () => {
    await expect(guard.canActivate(contexto().ctx)).rejects.toThrow(UnauthorizedException);
  });

  it.each(['ADMIN', 'PROFESSOR', 'ALUNO'])('bloqueia %s', async (role) => {
    jwt.verifyAsync.mockResolvedValue({ sub: 1, role, escolaId: 1 });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(ForbiddenException);
  });

  it('libera SUPERADMIN', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN', email: DONO });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).resolves.toBe(true);
  });

  it('bloqueia SUPERADMIN que saiu da lista de donos', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN', email: 'outro@exemplo.com' });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(UnauthorizedException);
  });
});

describe('JwtAuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const prisma = novoPrisma();
  const guard = new JwtAuthGuard(jwt as any, prisma as any);

  beforeEach(() => jest.resetAllMocks());

  it('bloqueia sem token', async () => {
    await expect(guard.canActivate(contexto().ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('libera aluno com token válido que ainda existe na escola', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 4, role: 'ALUNO', escolaId: 1 });
    prisma.aluno.findFirst.mockResolvedValue({ id: 4 });
    const { ctx, request } = contexto('Bearer x');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user.sub).toBe(4);
  });

  it('libera professor que ainda existe', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 7, role: 'PROFESSOR', escolaId: 1 });
    prisma.professor.findFirst.mockResolvedValue({ id: 7 });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).resolves.toBe(true);
  });

  it.each([
    ['ALUNO', 'aluno'],
    ['PROFESSOR', 'professor'],
    ['ADMIN', 'admin'],
  ] as const)('%s removido perde o acesso na hora', async (role, tabela) => {
    jwt.verifyAsync.mockResolvedValue({ sub: 4, role, escolaId: 1 });
    prisma[tabela].findFirst.mockResolvedValue(null);
    await expect(guard.canActivate(contexto('Bearer x').ctx)).rejects.toThrow(UnauthorizedException);
  });
});
