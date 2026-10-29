import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';

type EscolaResumo = { id: number; nome: string; logoUrl: string | null };

const resumoEscola = (e: EscolaResumo): EscolaResumo => ({
  id: e.id,
  nome: e.nome,
  logoUrl: e.logoUrl,
});

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /** E-mails do dono do sistema (superadmin). */
  private getSuperAdminEmails(): string[] {
    return (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }

  async loginComGoogle(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;

    if (!email) {
      throw new UnauthorizedException('Não foi possível validar a conta Google.');
    }

    const porEmail = { email: { equals: email, mode: 'insensitive' as const } };

    // 1. Dono do sistema
    if (this.getSuperAdminEmails().includes(email.toLowerCase())) {
      const token = await this.jwtService.signAsync({ sub: 0, role: 'SUPERADMIN', email });
      return {
        token,
        usuario: { role: 'SUPERADMIN' as const, email, nome: payload?.name || 'Administrador' },
      };
    }

    // 2. Administrador de uma escola
    const admin = await this.prisma.admin.findFirst({ where: porEmail, include: { escola: true } });
    if (admin) {
      const token = await this.jwtService.signAsync({
        sub: admin.id,
        role: 'ADMIN',
        email: admin.email,
        escolaId: admin.escolaId,
      });
      return {
        token,
        usuario: {
          role: 'ADMIN' as const,
          id: admin.id,
          nome: admin.nome,
          email: admin.email,
          escola: resumoEscola(admin.escola),
        },
      };
    }

    // 3. Professor
    const professor = await this.prisma.professor.findFirst({
      where: porEmail,
      include: { escola: true },
    });
    if (professor) {
      const token = await this.jwtService.signAsync({
        sub: professor.id,
        role: 'PROFESSOR',
        email: professor.email,
        escolaId: professor.escolaId,
      });
      return {
        token,
        usuario: {
          role: 'PROFESSOR' as const,
          id: professor.id,
          nome: professor.nome,
          email: professor.email,
          disciplina: professor.disciplina,
          escola: resumoEscola(professor.escola),
        },
      };
    }

    // 4. Aluno
    const aluno = await this.prisma.aluno.findFirst({ where: porEmail, include: { escola: true } });
    if (aluno) {
      const token = await this.jwtService.signAsync({
        sub: aluno.id,
        role: 'ALUNO',
        email: aluno.email,
        escolaId: aluno.escolaId,
      });
      return {
        token,
        usuario: {
          role: 'ALUNO' as const,
          id: aluno.id,
          nome: aluno.nome,
          email: aluno.email,
          serie: aluno.serie,
          escola: resumoEscola(aluno.escola),
        },
      };
    }

    throw new UnauthorizedException('Esse e-mail não está cadastrado no ClassBoard.');
  }
}
