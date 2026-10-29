import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

export type Papel = 'SUPERADMIN' | 'ADMIN' | 'PROFESSOR' | 'ALUNO';

/** Conteúdo do token JWT (e de request.user depois dos guards). */
export type AuthUser = {
  sub: number;
  role: Papel;
  email: string;
  escolaId?: number;
};

/**
 * Injeta o id da escola em que o usuário está operando.
 * Admin/professor/aluno: vem do token. Superadmin: vem do cabeçalho x-escola-id (validado no AdminGuard).
 */
export const EscolaAtual = createParamDecorator((_data: unknown, ctx: ExecutionContext): number => {
  const user = ctx.switchToHttp().getRequest<{ user?: AuthUser }>().user;
  if (!user?.escolaId) {
    throw new BadRequestException('Selecione uma escola para continuar.');
  }
  return user.escolaId;
});
