import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * Bloqueia a ação quando quem está chamando é um aluno logado (token JWT com role ALUNO).
 * Sem token (acesso anônimo, como já era antes do login) continua passando — essa rota
 * ainda não tem um login de admin/professor dedicado.
 */
@Injectable()
export class NotAlunoGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const payload = await this.jwtService.verifyAsync<{ role?: string }>(token);
      if (payload.role === 'ALUNO') {
        throw new ForbiddenException('Alunos não têm permissão para essa ação.');
      }
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      // token inválido/expirado: não é um aluno autenticado válido, deixa passar
      // (mesmo comportamento de antes, sem login nenhum)
      return true;
    }
  }
}
