# ClassBoard

Sistema web para escolas agendarem **reforço individual** (aulas e provas): cadastro de professores, alunos e turmas, agendamento com aviso por e-mail e notificação, e relatórios.

- Site: https://classboard-three.vercel.app
- Tecnologias: Next.js (Vercel), NestJS + Prisma (Render), PostgreSQL (Neon), login com Google, e-mails pelo Brevo.

## Perfis
- **Dono do sistema** (e-mails em `ADMIN_EMAILS`): cadastra escolas e seus administradores.
- **Administrador da escola:** professores, alunos, turmas, aulas, relatórios e a marca da escola.
- **Professor / Aluno:** veem as próprias aulas e notificações.

O login é só com a conta Google, e apenas e-mails cadastrados pela escola entram.

## Rodar localmente
Requisitos: Node 24.9 ou mais novo e um banco PostgreSQL (ex.: Neon).

```bash
cd backend
npm install
# backend/.env: DATABASE_URL, GOOGLE_CLIENT_ID, JWT_SECRET, ADMIN_EMAILS (modelo em env.example.yaml)
npx prisma migrate dev
npm run start:dev        # http://localhost:3000

cd ../frontend
npm install
# frontend/.env.local: NEXT_PUBLIC_API_URL=http://localhost:3000 e NEXT_PUBLIC_GOOGLE_CLIENT_ID
npm run dev -- -p 3001   # http://localhost:3001
```

Testes do backend: `cd backend && npm test`.

## Publicar
Veja [docs/DEPLOY.md](docs/DEPLOY.md). Backup do banco: [docs/BACKUP.md](docs/BACKUP.md).

## Autor
Nilton Vezaro Junior — NV T.I
