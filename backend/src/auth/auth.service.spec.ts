import { UnauthorizedException } from '@nestjs/common';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken: mockVerifyIdToken })),
}));
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { AuthService } from './auth.service';

describe('AuthService.loginComGoogle', () => {
  const escola = { id: 1, nome: 'Colégio Teste', logoUrl: null, createdAt: new Date() };
  const prisma = {
    admin: { findFirst: jest.fn() },
    professor: { findFirst: jest.fn() },
    aluno: { findFirst: jest.fn() },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token-falso') };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwt.signAsync.mockResolvedValue('token-falso');
    process.env.ADMIN_EMAILS = 'Dono@exemplo.com, outro@exemplo.com';
    prisma.admin.findFirst.mockResolvedValue(null);
    prisma.professor.findFirst.mockResolvedValue(null);
    prisma.aluno.findFirst.mockResolvedValue(null);
    service = new AuthService(prisma as any, jwt as any);
  });

  const googleRetorna = (email?: string, name = 'Fulano') =>
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => ({ email, name }) });

  it('e-mail de ADMIN_EMAILS vira SUPERADMIN, sem diferenciar maiúsculas e sem escola', async () => {
    googleRetorna('DONO@exemplo.com');
    const r = await service.loginComGoogle('cred');
    expect(r.usuario.role).toBe('SUPERADMIN');
    const payload = jwt.signAsync.mock.calls[0][0];
    expect(payload.role).toBe('SUPERADMIN');
    expect(payload.escolaId).toBeUndefined();
    expect(prisma.admin.findFirst).not.toHaveBeenCalled();
  });

  it('admin de escola recebe escolaId no token e a escola na resposta', async () => {
    googleRetorna('diretor@escola.com');
    prisma.admin.findFirst.mockResolvedValue({
      id: 5, nome: 'Diretor', email: 'diretor@escola.com', escolaId: 1, escola,
    });
    const r = await service.loginComGoogle('cred');
    expect(r.usuario.role).toBe('ADMIN');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 5, role: 'ADMIN', escolaId: 1 }),
    );
    expect((r.usuario as any).escola).toEqual({ id: 1, nome: 'Colégio Teste', logoUrl: null });
  });

  it('busca o e-mail sem diferenciar maiúsculas', async () => {
    googleRetorna('Ana@Escola.com');
    await service.loginComGoogle('cred').catch(() => undefined);
    expect(prisma.admin.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: { equals: 'Ana@Escola.com', mode: 'insensitive' } } }),
    );
  });

  it('reconhece professor cadastrado', async () => {
    googleRetorna('prof@escola.com');
    prisma.professor.findFirst.mockResolvedValue({
      id: 7, nome: 'Ana', email: 'prof@escola.com', disciplina: 'Matemática', escolaId: 1, escola,
    });
    const r = await service.loginComGoogle('cred');
    expect(r.usuario.role).toBe('PROFESSOR');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 7, role: 'PROFESSOR', escolaId: 1 }),
    );
  });

  it('reconhece aluno cadastrado', async () => {
    googleRetorna('aluno@escola.com');
    prisma.aluno.findFirst.mockResolvedValue({
      id: 3, nome: 'Beto', email: 'aluno@escola.com', serie: '9º ano', escolaId: 2, escola: { ...escola, id: 2 },
    });
    const r = await service.loginComGoogle('cred');
    expect(r.usuario.role).toBe('ALUNO');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 3, role: 'ALUNO', escolaId: 2 }),
    );
  });

  it('recusa e-mail não cadastrado', async () => {
    googleRetorna('estranho@gmail.com');
    await expect(service.loginComGoogle('cred')).rejects.toThrow(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('recusa token do Google sem e-mail', async () => {
    googleRetorna(undefined);
    await expect(service.loginComGoogle('cred')).rejects.toThrow(UnauthorizedException);
  });
});
