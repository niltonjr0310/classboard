# Backup do banco (Neon)

## O que o Neon já oferece (plano gratuito)
- **Voltar no tempo:** só até **6 horas** atrás (Neon → Backup & Restore → Restore from history).
- **Snapshot manual:** apenas **1** no plano gratuito. Snapshots automáticos exigem plano pago.
- Ao cobrar de escolas, assine um plano pago do Neon (histórico maior e snapshots agendados).

## Backup semanal em arquivo (o que vale de verdade)
Requisito: PostgreSQL **18** "Command Line Tools" (o banco do Neon é versão 18; o `pg_dump` precisa ser da mesma versão ou mais novo).

No PowerShell, na raiz do projeto:
```
powershell -ExecutionPolicy Bypass -File backend\scripts\backup.ps1
```
Cole a URL **direta** do Neon (sem `-pooler`) quando pedir. O arquivo `classboard-AAAA-MM-DD.dump` fica em `Documentos\backups-classboard`. **Copie para o Google Drive** (ou outro lugar fora do computador). Guarde ao menos os últimos 4.

> Os arquivos `.dump` contêm dados pessoais de alunos: nunca coloque no GitHub e mantenha o Drive privado.

## Restaurar
Sempre em um banco/branch **de teste** primeiro (crie um branch no Neon):
```
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --clean --if-exists --no-owner -d "URL-DO-BANCO-DE-TESTE" "caminho\classboard-AAAA-MM-DD.dump"
```
Só depois de conferir os dados, repita na produção, se for preciso.

## Antes de mudanças grandes no banco
Rode o backup acima **antes** do `prisma migrate deploy`.
