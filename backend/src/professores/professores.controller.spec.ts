jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

import { ProfessoresController } from './professores.controller';
import { AdminGuard } from '../auth/admin.guard';

describe('ProfessoresController', () => {
  it('toda rota exige AdminGuard (exceto /aulas/minhas, que exige login)', () => {
    const proto = ProfessoresController.prototype as any;
    const classeProtegida = (Reflect.getMetadata('__guards__', ProfessoresController) ?? []).includes(AdminGuard);
    const rotas = Object.getOwnPropertyNames(proto).filter((n) => n !== 'constructor' && n !== 'findMinhas');
    expect(rotas.length).toBeGreaterThan(0);
    for (const nome of rotas) {
      const guards = Reflect.getMetadata('__guards__', proto[nome]) ?? [];
      expect({ nome, admin: classeProtegida || guards.includes(AdminGuard) }).toEqual({ nome, admin: true });
    }
  });
});
