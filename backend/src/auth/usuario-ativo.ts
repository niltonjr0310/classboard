import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth-user';
import { emailsDoDono } from './email-livre';

/**
 * Confere no banco se quem tem o token ainda existe. Assim, quando a escola remove um
 * professor, aluno ou admin, o acesso acaba na hora (e não só quando o token vence).
 */
export async function garantirUsuarioAtivo(prisma: PrismaService, usuario: AuthUser) {
  const revogado = () =>
    new UnauthorizedException('Seu acesso foi removido. Fale com a administração da escola.');

  switch (usuario.role) {
    case 'SUPERADMIN':
      if (!emailsDoDono().includes((usuario.email ?? '').toLowerCase())) throw revogado();
      return;
    case 'ADMIN': {
      const admin = await prisma.admin.findFirst({
        where: { id: usuario.sub, escolaId: usuario.escolaId },
        select: { id: true },
      });
      if (!admin) throw revogado();
      return;
    }
    case 'PROFESSOR': {
      const professor = await prisma.professor.findFirst({
        where: { id: usuario.sub, escolaId: usuario.escolaId },
        select: { id: true },
      });
      if (!professor) throw revogado();
      return;
    }
    case 'ALUNO': {
      const aluno = await prisma.aluno.findFirst({
        where: { id: usuario.sub, escolaId: usuario.escolaId },
        select: { id: true },
      });
      if (!aluno) throw revogado();
      return;
    }
    default:
      throw revogado();
  }
}
