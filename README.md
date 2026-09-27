# ClassBoard

Aplicação web para gestão de aulas particulares — cadastro de professores e alunos, agendamento de aulas e acompanhamento de status.

## Vídeo de apresentação

[Link do vídeo no YouTube](#) <!-- substituir pelo link real -->

## Aplicação online

- Frontend: https://classboard-three.vercel.app
- Backend/API: https://classboard-production-834b.up.railway.app

## Tecnologias

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript
- **Banco de dados:** PostgreSQL (Neon)
- **ORM:** Prisma

## Funcionalidades

- CRUD de Professores (nome, email, disciplina)
- CRUD de Alunos (nome, email, série)
- CRUD de Aulas (data/hora, duração, status, vínculo com professor e aluno)
- Atualização de status da aula (agendada, concluída, cancelada)

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Uma conta gratuita no [Neon](https://neon.tech) (ou outro PostgreSQL)

### Backend

\`\`\`bash
cd backend
npm install
\`\`\`

Crie um arquivo `.env` na pasta `backend` com:
\`\`\`
DATABASE_URL="sua-connection-string-do-postgresql"
\`\`\`

Rode as migrations e inicie o servidor:
\`\`\`bash
npx prisma migrate dev
npm run start:dev
\`\`\`

A API estará disponível em `http://localhost:3000`.

### Frontend

\`\`\`bash
cd frontend
npm install
npm run dev -- -p 3001
\`\`\`

A aplicação estará disponível em `http://localhost:3001`.

## Estrutura do projeto

\`\`\`
classboard/
├── backend/    # API NestJS + Prisma
├── frontend/   # Interface Next.js
└── README.md
\`\`\`

## Autor

Nilton Vezaro Junior — UNOESC, Programação IV