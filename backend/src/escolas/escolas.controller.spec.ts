jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { EscolasController } from './escolas.controller';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('EscolasController', () => {
  const proto = EscolasController.prototype as any;
  const guardsDe = (nome: string) => Reflect.getMetadata('__guards__', proto[nome]) ?? [];

  it('gerenciar escolas e admins é só do dono do sistema', () => {
    for (const nome of ['findAll', 'create', 'update', 'remove', 'listAdmins', 'addAdmin', 'removeAdmin']) {
      expect(guardsDe(nome)).toContain(SuperAdminGuard);
    }
  });

  it('o admin da escola edita só a própria escola; qualquer logado lê a sua', () => {
    expect(guardsDe('atualizarMinha')).toContain(AdminGuard);
    expect(guardsDe('minha')).toContain(JwtAuthGuard);
  });
});
