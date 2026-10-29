import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não informado.');
    }

    const token = authHeader.slice('Bearer '.length);

    try {
      const payload = await this.jwtService.verifyAsync(token);
      (request as Request & { user: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
