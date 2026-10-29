import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthUser } from './auth-user';
import { emailsDoDono } from './email-livre';

/** Só o dono do sistema (e-mails em ADMIN_EMAILS). Usado para gerenciar escolas. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Faça login.');
    }

    let payload: AuthUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(authHeader.slice('Bearer '.length));
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    if (payload.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Apenas o dono do sistema pode fazer isso.');
    }
    if (!emailsDoDono().includes((payload.email ?? '').toLowerCase())) {
      throw new UnauthorizedException('Seu acesso foi removido.');
    }

    (request as Request & { user: AuthUser }).user = payload;
    return true;
  }
}
