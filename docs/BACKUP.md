# Backup do banco (Neon)

- O Neon mantém histórico para restaurar o banco a um ponto no tempo (no plano gratuito a janela é curta; em planos pagos é maior). Veja em Neon → Branches → Restore.
- Antes de qualquer migration grande, crie um **branch** do banco no Neon (cópia instantânea) e só depois rode `prisma migrate deploy`.
- Backup extra (recomendado mensalmente, com o `pg_dump` instalado):
  ```
  pg_dump "<URL-DIRETA>" -Fc -f classboard-AAAA-MM-DD.dump
  ```
  Guarde o arquivo fora do computador da escola (nuvem privada).
- Teste a restauração de vez em quando: `pg_restore -d <URL-de-teste> arquivo.dump`.
