jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AulasService } from './aulas.service';

describe('AulasService', () => {
  const prisma = {
    aula: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
    professor: { findFirst: jest.fn() },
    aluno: { findFirst: jest.fn() },
  };
  const notificacoes = { criar: jest.fn().mockResolvedValue({}) };
  const email = { enviar: jest.fn().mockResolvedValue(undefined) };
  let service: AulasService;

  const escola = { id: 1, nome: 'Colégio Teste', logoUrl: 'https://exemplo.com/logo.png' };
  const aulaBase = {
    id: 1,
    tipo: 'aula',
    materia: 'Matemática',
    status: 'agendada',
    dataHora: new Date('2026-11-10T17:00:00Z'), // 14:00 em Brasília
    alunoId: 10,
    professorId: 20,
    escolaId: 1,
    escola,
    aluno: { nome: 'Beto', email: 'beto@escola.com' },
    professor: { nome: 'Ana', email: 'ana@escola.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.professor.findFirst.mockResolvedValue({ id: 20 });
    prisma.aluno.findFirst.mockResolvedValue({ id: 10 });
    service = new AulasService(prisma as any, notificacoes as any, email as any);
  });

  describe('create', () => {
    const dto = { dataHora: '2026-11-10T17:00:00Z', duracao: 60, professorId: 20, alunoId: 10 } as any;

    it('grava a aula na escola informada, nunca em outra', async () => {
      prisma.aula.create.mockResolvedValue(aulaBase);
      await service.create({ ...dto, escolaId: 999 }, 1);
      expect(prisma.aula.create.mock.calls[0][0].data.escolaId).toBe(1);
    });

    it('recusa professor ou aluno de outra escola', async () => {
      prisma.professor.findFirst.mockResolvedValue(null);
      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
      expect(prisma.professor.findFirst).toHaveBeenCalledWith({ where: { id: 20, escolaId: 1 } });
      expect(prisma.aula.create).not.toHaveBeenCalled();

      prisma.professor.findFirst.mockResolvedValue({ id: 20 });
      prisma.aluno.findFirst.mockResolvedValue(null);
      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('não agenda para aluno cujo responsável ainda não autorizou', async () => {
      prisma.aluno.findFirst.mockResolvedValue({ id: 10, nome: 'Beto', responsavelEmail: 'mae@x.com', consentimentoEm: null });
      await expect(service.create(dto, 1)).rejects.toThrow(/autorização do responsável/);
      expect(prisma.aula.create).not.toHaveBeenCalled();
    });

    it('agenda se o responsável autorizou ou se não há responsável cadastrado', async () => {
      prisma.aula.create.mockResolvedValue(aulaBase);
      prisma.aluno.findFirst.mockResolvedValue({ id: 10, responsavelEmail: 'mae@x.com', consentimentoEm: new Date() });
      await service.create(dto, 1);
      prisma.aluno.findFirst.mockResolvedValue({ id: 10, responsavelEmail: null, consentimentoEm: null });
      await service.create(dto, 1);
      expect(prisma.aula.create).toHaveBeenCalledTimes(2);
    });

    it('notifica e envia e-mail para aluno e professor com a marca da escola', async () => {
      prisma.aula.create.mockResolvedValue(aulaBase);
      await service.create(dto, 1);
      expect(notificacoes.criar).toHaveBeenCalledTimes(2);
      expect(email.enviar).toHaveBeenCalledTimes(2);
      const [para, assunto, html, remetente] = email.enviar.mock.calls[0];
      expect(para).toBe('beto@escola.com');
      expect(assunto).toContain('Colégio Teste');
      expect(html).toContain('Colégio Teste');
      expect(html).toContain('https://exemplo.com/logo.png');
      expect(remetente).toBe('Colégio Teste');
    });

    it('usa o fuso de São Paulo e cita a matéria', async () => {
      prisma.aula.create.mockResolvedValue(aulaBase);
      await service.create(dto, 1);
      const mensagem = notificacoes.criar.mock.calls[0][3] as string;
      expect(mensagem).toContain('de Matemática');
      expect(mensagem).toContain('14:00');
    });

    it('escapa HTML em nomes e matéria nos e-mails', async () => {
      prisma.aula.create.mockResolvedValue({ ...aulaBase, materia: '<b>X</b>', aluno: { nome: '<script>', email: 'a@a.com' } });
      await service.create(dto, 1);
      const html = email.enviar.mock.calls[0][2] as string;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('trata prova como prova e qualquer outro valor como aula', async () => {
      prisma.aula.create.mockResolvedValue({ ...aulaBase, tipo: 'prova' });
      await service.create({ ...dto, tipo: 'prova' }, 1);
      expect(prisma.aula.create.mock.calls[0][0].data.tipo).toBe('prova');
      expect(notificacoes.criar.mock.calls[0][2]).toBe('Nova prova agendada');

      await service.create({ ...dto, tipo: 'qualquer-coisa' }, 1);
      expect(prisma.aula.create.mock.calls[1][0].data.tipo).toBe('aula');
    });
  });

  describe('update', () => {
    it('não encontra aula de outra escola', async () => {
      prisma.aula.findFirst.mockResolvedValue(null);
      await expect(service.update(1, { status: 'concluida' }, 2)).rejects.toThrow(NotFoundException);
      expect(prisma.aula.findFirst).toHaveBeenCalledWith({ where: { id: 1, escolaId: 2 } });
      expect(prisma.aula.update).not.toHaveBeenCalled();
    });

    it('avisa quando a aula passa para cancelada', async () => {
      prisma.aula.findFirst.mockResolvedValue({ ...aulaBase, status: 'agendada' });
      prisma.aula.update.mockResolvedValue({ ...aulaBase, status: 'cancelada' });
      await service.update(1, { status: 'cancelada' }, 1);
      expect(notificacoes.criar).toHaveBeenCalledTimes(2);
      expect(notificacoes.criar.mock.calls[0][2]).toBe('Aula cancelada');
      expect(email.enviar).toHaveBeenCalledTimes(2);
    });

    it('não avisa de novo se já estava cancelada', async () => {
      prisma.aula.findFirst.mockResolvedValue({ ...aulaBase, status: 'cancelada' });
      prisma.aula.update.mockResolvedValue({ ...aulaBase, status: 'cancelada' });
      await service.update(1, { status: 'cancelada' }, 1);
      expect(notificacoes.criar).not.toHaveBeenCalled();
    });

    it('não avisa em mudanças que não são cancelamento', async () => {
      prisma.aula.findFirst.mockResolvedValue(aulaBase);
      prisma.aula.update.mockResolvedValue({ ...aulaBase, status: 'concluida' });
      await service.update(1, { status: 'concluida' }, 1);
      expect(notificacoes.criar).not.toHaveBeenCalled();
      expect(email.enviar).not.toHaveBeenCalled();
    });

    it('avisa aluno e professor quando a data/hora muda', async () => {
      prisma.aula.findFirst.mockResolvedValue(aulaBase);
      prisma.aula.update.mockResolvedValue({ ...aulaBase, dataHora: new Date('2026-11-12T18:00:00Z') });
      await service.update(1, { dataHora: '2026-11-12T18:00:00Z' }, 1);
      expect(notificacoes.criar).toHaveBeenCalledTimes(2);
      expect(notificacoes.criar.mock.calls[0][2]).toBe('Aula remarcada');
      const mensagem = notificacoes.criar.mock.calls[0][3] as string;
      expect(mensagem).toContain('10/11/2026');
      expect(mensagem).toContain('12/11/2026');
      expect(email.enviar).toHaveBeenCalledTimes(2);
      expect(email.enviar.mock.calls[0][1]).toContain('remarcada');
    });

    it('não avisa de remarcação se a data/hora continua a mesma', async () => {
      prisma.aula.findFirst.mockResolvedValue(aulaBase);
      prisma.aula.update.mockResolvedValue(aulaBase);
      await service.update(1, { dataHora: '2026-11-10T17:00:00Z', duracao: 45 }, 1);
      expect(notificacoes.criar).not.toHaveBeenCalled();
      expect(email.enviar).not.toHaveBeenCalled();
    });

    it('se cancela e muda a data juntos, avisa só do cancelamento', async () => {
      prisma.aula.findFirst.mockResolvedValue(aulaBase);
      prisma.aula.update.mockResolvedValue({
        ...aulaBase,
        status: 'cancelada',
        dataHora: new Date('2026-11-12T18:00:00Z'),
      });
      await service.update(1, { status: 'cancelada', dataHora: '2026-11-12T18:00:00Z' }, 1);
      expect(notificacoes.criar).toHaveBeenCalledTimes(2);
      expect(notificacoes.criar.mock.calls[0][2]).toBe('Aula cancelada');
    });

    it('nunca deixa mudar a escola da aula', async () => {
      prisma.aula.findFirst.mockResolvedValue(aulaBase);
      prisma.aula.update.mockResolvedValue(aulaBase);
      await service.update(1, { status: 'concluida', escolaId: 77 } as any, 1);
      expect(prisma.aula.update.mock.calls[0][0].data).not.toHaveProperty('escolaId');
    });
  });
});
