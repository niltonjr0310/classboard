import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

export type RegistroProprio = { tipo: 'admin' | 'professor' | 'aluno'; id: number };

/** E-mails do dono do sistema (ADMIN_EMAILS). */
export function emailsDoDono(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * O mesmo e-mail não pode ser admin, professor e aluno ao mesmo tempo (o login ficaria ambíguo),
 * nem repetir o de outro cadastro, nem ser o do dono do sistema.
 * Ao editar, passe o próprio registro em `proprio` para ele não bater em si mesmo.
 */
export async function garantirEmailLivre(
  prisma: PrismaService,
  email: string,
  proprio?: RegistroProprio,
) {
  const igual = { equals: email, mode: 'insensitive' as const };
  const menosEle = (tipo: RegistroProprio['tipo']) =>
    proprio && proprio.tipo === tipo ? { id: { not: proprio.id } } : {};

  const [admin, professor, aluno] = await Promise.all([
    prisma.admin.findFirst({ where: { email: igual, ...menosEle('admin') } }),
    prisma.professor.findFirst({ where: { email: igual, ...menosEle('professor') } }),
    prisma.aluno.findFirst({ where: { email: igual, ...menosEle('aluno') } }),
  ]);

  if (admin || professor || aluno || emailsDoDono().includes(email.toLowerCase())) {
    throw new ConflictException('Esse e-mail já está cadastrado no ClassBoard.');
  }
}
