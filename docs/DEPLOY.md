# Deploy — ClassBoard

Front: Vercel · Backend: Google Cloud Run · Banco: Neon (projeto separado para produção).

## 1. Banco de produção (Neon)
1. Crie um projeto novo no Neon (ex.: `classboard-prod`), separado do banco de testes.
2. Copie duas URLs: a **direta** (para migrations) e a **pooled** (`-pooler`, para o app).
3. Aplicar as migrations (PowerShell, pasta `backend`):
   ```
   $env:DATABASE_URL = "<URL-DIRETA>"
   npx prisma migrate deploy
   ```
   Isso cria as tabelas e a escola "Colégio Auxiliadora".

## 2. Variáveis do backend
Copie `backend/env.example.yaml` para `backend/env.yaml` e preencha (use a URL **pooled**; o JWT_SECRET é um segredo novo: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

## 3. Cloud Run
Uma vez: instalar o Google Cloud CLI, `gcloud auth login`, `gcloud config set project SEU-PROJETO`, ativar o faturamento no projeto e criar um alerta de orçamento.

Na pasta `backend`:
```
gcloud run deploy classboard-api --source . --region us-central1 --allow-unauthenticated --env-vars-file env.yaml --max-instances 3
```
O comando termina mostrando a URL do serviço (`https://classboard-api-xxxx.run.app`). Teste abrindo `<URL>/` no navegador.

## 4. Google (login)
Google Cloud Console → APIs e serviços → Credenciais → seu Client ID → **Origens JavaScript autorizadas**: adicione a URL do site na Vercel (ex.: `https://classboard-three.vercel.app`).

## 5. Vercel (front)
Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` = URL do Cloud Run (sem barra no final)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = o mesmo Client ID
Depois, Redeploy (as variáveis `NEXT_PUBLIC_*` entram no build).

## Atualizar depois
Backend: repetir o comando do passo 3. Front: `git push`. Mudou o banco? `prisma migrate deploy` (passo 1) **antes** de subir o backend novo.
