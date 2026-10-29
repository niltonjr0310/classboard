-- CreateTable
CREATE TABLE "Notificacao" (
    "id" SERIAL NOT NULL,
    "destinatario" TEXT NOT NULL,
    "destinatarioId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);
