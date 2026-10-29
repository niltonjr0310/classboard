# Deploy — ClassBoard

Site: Vercel · API: Render (Docker) · Banco: Neon · E-mails: Brevo · Login: Google.

## 1. Banco (Neon)
1. Projeto separado para produção (ex.: `classboard-prod`).
2. Duas URLs: a **direta** (migrations) e a **pooled** (`-pooler`, usada pelo app).
3. Migrations (PowerShell, pasta `backend`):
   ```
   $env:DATABASE_URL = "<URL-DIRETA>"
   npx prisma migrate deploy
   ```

## 2. API (Render)
New + → Web Service → repositório do GitHub →
- **Language:** Docker · **Root Directory:** `backend` · **Branch:** `main` · **Instance:** Free (ou pago)
- **Environment:** `DATABASE_URL` (pooled), `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `ADMIN_EMAILS`, `BREVO_API_KEY`, `EMAIL_FROM`
  (modelo em `backend/env.example.yaml`; `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

O Render gratuito dorme após ~15 min sem uso (primeiro acesso demora ~1 min) e **bloqueia SMTP**: por isso os e-mails saem pela API do Brevo.
Para manter acordado, use um monitor (UptimeRobot etc.) acessando `https://SUA-API.onrender.com/` a cada 5 min — ou um plano pago.

## 3. E-mails (Brevo)
Conta grátis (300/dia) → Remetentes: adicionar e **verificar** o e-mail usado em `EMAIL_FROM` → Chaves de API: criar com permissão só de **E-mails transacionais** → `BREVO_API_KEY`.
Para não cair no spam, autentique um domínio próprio no Brevo e use um remetente desse domínio.

## 4. Login (Google)
Google Cloud Console → APIs e serviços → Credenciais → seu Client ID → **Origens JavaScript autorizadas**: URL do site (ex.: `https://classboard-three.vercel.app`) e `http://localhost:3001` para testes locais.

## 5. Site (Vercel)
Settings → Environment Variables (tipo **Config**; `NEXT_PUBLIC_*` não pode ser Secret):
- `NEXT_PUBLIC_API_URL` = URL da API no Render (sem barra no final)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = o mesmo Client ID
Depois, Redeploy (as variáveis `NEXT_PUBLIC_*` entram no build).
O plano Hobby da Vercel é só para uso não comercial: ao cobrar, use um plano pago.

## Atualizar depois
`git push` atualiza o site (Vercel) e a API (Render) sozinhos. Mudou o banco? Rode `prisma migrate deploy` (passo 1) **antes** do push.
Mudou dependências do backend? Rode `npm install` na pasta `backend` e envie `package.json` e `package-lock.json` juntos (o build usa `npm ci`).
