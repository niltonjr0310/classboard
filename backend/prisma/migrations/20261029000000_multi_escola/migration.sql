-- Multi-escola: tabelas novas
CREATE TABLE "Escola" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escola_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Turma" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "escolaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Turma_pkey" PRIMARY KEY ("id")
);

-- Escola padrão: recebe todos os dados que já existem
INSERT INTO "Escola" ("nome") VALUES ('Colégio Auxiliadora');

-- Colunas novas (primeiro opcionais, preenchidas, depois obrigatórias)
ALTER TABLE "Professor" ADD COLUMN "escolaId" INTEGER;
ALTER TABLE "Aluno" ADD COLUMN "escolaId" INTEGER;
ALTER TABLE "Aluno" ADD COLUMN "turmaId" INTEGER;
ALTER TABLE "Aula" ADD COLUMN "escolaId" INTEGER;

UPDATE "Professor" SET "escolaId" = (SELECT MIN("id") FROM "Escola");
UPDATE "Aluno" SET "escolaId" = (SELECT MIN("id") FROM "Escola");
UPDATE "Aula" SET "escolaId" = (SELECT MIN("id") FROM "Escola");

ALTER TABLE "Professor" ALTER COLUMN "escolaId" SET NOT NULL;
ALTER TABLE "Aluno" ALTER COLUMN "escolaId" SET NOT NULL;
ALTER TABLE "Aula" ALTER COLUMN "escolaId" SET NOT NULL;

-- Índices
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE UNIQUE INDEX "Turma_escolaId_nome_key" ON "Turma"("escolaId", "nome");

-- Chaves estrangeiras
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Professor" ADD CONSTRAINT "Professor_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
