import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Destinatario = 'ALUNO' | 'PROFESSOR';

@Injectable()
export class NotificacoesService {
  constructor(private prisma: PrismaService) {}

  criar(destinatario: Destinatario, destinatarioId: number, titulo: string, mensagem: string) {
    return this.prisma.notificacao.create({
      data: { destinatario, destinatarioId, titulo, mensagem },
    });
  }

  findMinhas(role: Destinatario, id: number) {
    return this.prisma.notificacao.findMany({
      where: { destinatario: role, destinatarioId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  contarNaoLidas(role: Destinatario, id: number) {
    return this.prisma.notificacao.count({
      where: { destinatario: role, destinatarioId: id, lida: false },
    });
  }

  marcarLida(id: number, role: Destinatario, usuarioId: number) {
    // updateMany com o dono no filtro: ninguém marca a notificação de outra pessoa
    return this.prisma.notificacao.updateMany({
      where: { id, destinatario: role, destinatarioId: usuarioId },
      data: { lida: true },
    });
  }

  marcarTodasLidas(role: Destinatario, id: number) {
    return this.prisma.notificacao.updateMany({
      where: { destinatario: role, destinatarioId: id, lida: false },
      data: { lida: true },
    });
  }
}
