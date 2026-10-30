import { cabecalhosSeguranca, limitar, origensPermitidas } from './seguranca';

describe('segurança', () => {
  it('CORS: só o site e, fora de produção, o localhost', () => {
    expect(origensPermitidas({ NODE_ENV: 'production' } as any)).toEqual(['https://classboard-three.vercel.app']);
    expect(origensPermitidas({ NODE_ENV: 'production', CORS_ORIGINS: 'https://a.com/, https://b.com' } as any)).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
    expect(origensPermitidas({} as any)).toContain('http://localhost:3001');
  });

  it('coloca os cabeçalhos de segurança', () => {
    const res: any = { setHeader: jest.fn(), removeHeader: jest.fn() };
    const next = jest.fn();
    cabecalhosSeguranca({} as any, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(next).toHaveBeenCalled();
  });

  it('bloqueia depois do limite e libera na janela seguinte', () => {
    let t = 1000;
    const mw = limitar(2, 60000, () => t);
    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const req: any = { ip: '1.1.1.1' };
    mw(req, res, next);
    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(2);
    mw({ ip: '2.2.2.2' } as any, res, next); // outro IP não é afetado
    expect(next).toHaveBeenCalledTimes(3);
    t += 61000;
    mw(req, res, next);
    expect(next).toHaveBeenCalledTimes(4);
  });
});
