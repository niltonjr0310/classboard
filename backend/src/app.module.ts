import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfessoresModule } from './professores/professores.module';
import { AlunosModule } from './alunos/alunos.module';
import { AulasModule } from './aulas/aulas.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';
import { EmailModule } from './email/email.module';
import { EscolasModule } from './escolas/escolas.module';
import { TurmasModule } from './turmas/turmas.module';
import { RelatoriosModule } from './relatorios/relatorios.module';

@Module({
  imports: [
    ProfessoresModule,
    AlunosModule,
    AulasModule,
    PrismaModule,
    AuthModule,
    NotificacoesModule,
    EmailModule,
    EscolasModule,
    TurmasModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
