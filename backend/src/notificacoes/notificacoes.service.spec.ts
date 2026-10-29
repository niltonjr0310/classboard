jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { NotificacoesService } from './notificacoes.service';

describe('NotificacoesService', () => {
  const prisma = { notificacao: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
  const service = new NotificacoesService(prisma as any);

  it('só marca como lida a notificação do próprio dono', async () => {
    await service.marcarLida(5, 'ALUNO', 10);
    expect(prisma.notificacao.updateMany).toHaveBeenCalledWith({
      where: { id: 5, destinatario: 'ALUNO', destinatarioId: 10 },
      data: { lida: true },
    });
  });
});
