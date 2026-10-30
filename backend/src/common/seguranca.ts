import type { NextFunction, Request, Response } from 'express';

/** Origens permitidas no CORS: CORS_ORIGINS (separadas por vírgula) ou o site padrão + localhost. */
export function origensPermitidas(env = process.env): string[] {
  const lista = (env.CORS_ORIGINS || env.FRONTEND_URL || 'https://classboard-three.vercel.app')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (env.NODE_ENV !== 'production') lista.push('http://localhost:3001', 'http://localhost:3000');
  return lista;
}

/** Cabeçalhos de segurança básicos (o que o helmet faz de mais importante para uma API). */
export function cabecalhosSeguranca(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.removeHeader('X-Powered-By');
  next();
}

/** Limite de requisições por IP numa janela de tempo (em memória; basta para uma instância). */
export function limitar(max: number, janelaMs: number, agora: () => number = Date.now) {
  const contagem = new Map<string, { n: number; ate: number }>();
  const faxina = setInterval(() => {
    const t = agora();
    for (const [ip, c] of contagem) if (c.ate <= t) contagem.delete(ip);
  }, janelaMs);
  faxina.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'desconhecido';
    const t = agora();
    const c = contagem.get(ip);
    if (!c || c.ate <= t) {
      contagem.set(ip, { n: 1, ate: t + janelaMs });
      return next();
    }
    c.n += 1;
    if (c.n > max) {
      res.setHeader('Retry-After', String(Math.ceil((c.ate - t) / 1000)));
      return res
        .status(429)
        .json({ statusCode: 429, message: 'Muitas tentativas. Aguarde um pouco e tente de novo.' });
    }
    next();
  };
}
