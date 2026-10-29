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

describe('AdminGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const prisma = { escola: { findUnique: jest.fn() } };
  const guard = new AdminGuard(jwt as any, prisma as any);

  beforeEach(() => jest.resetAllMocks());

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

  it('SUPERADMIN usa a escola do cabeçalho quando ela existe', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN' });
    prisma.escola.findUnique.mockResolvedValue({ id: 4 });
    const { ctx, request } = contexto('Bearer x', { 'x-escola-id': '4' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user.escolaId).toBe(4);
  });

  it('SUPERADMIN fica sem escola se o cabeçalho falta ou a escola não existe', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN' });
    const sem = contexto('Bearer x');
    await guard.canActivate(sem.ctx);
    expect(sem.request.user.escolaId).toBeUndefined();

    prisma.escola.findUnique.mockResolvedValue(null);
    const inexistente = contexto('Bearer x', { 'x-escola-id': '123' });
    await guard.canActivate(inexistente.ctx);
    expect(inexistente.request.user.escolaId).toBeUndefined();
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
    jwt.verifyAsync.mockResolvedValue({ sub: 0, role: 'SUPERADMIN' });
    await expect(guard.canActivate(contexto('Bearer x').ctx)).resolves.toBe(true);
  });
});

describe('JwtAuthGuard', () => {
  const jwt = { verifyAsync: jest.fn() };
  const guard = new JwtAuthGuard(jwt as any);

  beforeEach(() => jest.resetAllMocks());

  it('bloqueia sem token', async () => {
    await expect(guard.canActivate(contexto().ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('libera qualquer perfil com token válido', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 4, role: 'ALUNO' });
    const { ctx, request } = contexto('Bearer x');
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user.sub).toBe(4);
  });
});
