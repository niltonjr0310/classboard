import { Module } from '@nestjs/common';
import { AulasService } from './aulas.service';
import { AulasController } from './aulas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificacoesModule, EmailModule],
  controllers: [AulasController],
  providers: [AulasService],
})
export class AulasModule {}
