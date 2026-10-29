# Backup e restauração — ClassBoard

O banco fica no **Neon (Postgres)**. Há duas camadas de proteção; use as duas.

## 1. Restauração do próprio Neon (sem instalar nada)
O Neon guarda o histórico do banco por alguns dias (a janela depende do plano) e permite voltar no tempo.

- Console do Neon → seu projeto → **Backup & Restore** (ou **Branches → Restore**).
- Escolha o horário anterior ao problema e restaure para um **novo branch** primeiro. Confira os dados e só então troque a `DATABASE_URL` (ou restaure sobre o branch principal).
- Conferir a janela do seu plano em **Settings → Storage / History retention**. Se for curta, dependa mais da camada 2.

## 2. Cópia local com `pg_dump` (independe do Neon)
1. Instale o PostgreSQL para Windows e marque só **Command Line Tools**.
2. Na raiz do projeto: `.\scripts\backup-db.ps1`
3. O arquivo vai para `backups\classboard-AAAAMMDD-HHMM.sql` (os 12 mais recentes ficam guardados).
4. Copie a pasta `backups` para um lugar seguro (Google Drive pessoal, HD externo). **Nunca** suba para o GitHub: ela tem dados de alunos. Adicione `backups/` ao `.gitignore` da raiz.

**Frequência sugerida:** semanal, e sempre antes de rodar uma migration ou de mexer em produção.

## Restaurar uma cópia
Num banco **vazio** (um branch novo do Neon, por exemplo):

```
psql "<URL-direta-do-banco-novo>" -f backups\classboard-AAAAMMDD-HHMM.sql
```

Depois aponte `DATABASE_URL` (Railway e `.env`) para o banco restaurado e reinicie o backend.

## Teste a restauração
Backup que nunca foi restaurado não é backup. Uma vez, restaure um arquivo num branch de teste do Neon e confira se alunos, professores e aulas estão lá.

## Rotina antes de cada migration
1. `.\scripts\backup-db.ps1`
2. `npx prisma migrate dev` (local) ou `npx prisma migrate deploy` (produção)
3. Testar o app.
