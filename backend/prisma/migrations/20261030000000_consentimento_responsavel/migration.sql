-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN "responsavelNome" TEXT,
ADD COLUMN "responsavelEmail" TEXT,
ADD COLUMN "responsavelTelefone" TEXT,
ADD COLUMN "consentimentoToken" TEXT,
ADD COLUMN "consentimentoEnviadoEm" TIMESTAMP(3),
ADD COLUMN "consentimentoEm" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_consentimentoToken_key" ON "Aluno"("consentimentoToken");
