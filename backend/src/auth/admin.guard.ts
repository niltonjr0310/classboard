import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from './auth-user';

/**
 * Deixa passar admin de escola (ADMIN) e dono do sistema (SUPERADMIN).
 * - ADMIN: a escola vem do token.
 * - SUPERADMIN: a escola vem do cabeçalho x-escola-id e precisa existir.
 * Preenche request.user com { sub, role, email, escolaId }.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Faça login como administrador.');
    }

    const token = authHeader.slice('Bearer '.length);

    let payload: AuthUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Apenas administradores podem realizar essa ação.');
    }

    let escolaId = payload.escolaId;

    if (payload.role === 'SUPERADMIN') {
      const bruto = request.headers['x-escola-id'];
      const n = Number(Array.isArray(bruto) ? bruto[0] : bruto);
      escolaId = undefined;
      if (Number.isInteger(n) && n > 0) {
        const escola = await this.prisma.escola.findUnique({ where: { id: n } });
        if (escola) escolaId = escola.id;
      }
    }

    (request as Request & { user: AuthUser }).user = { ...payload, escolaId };
    return true;
  }
}
