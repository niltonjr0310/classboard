import { Module } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { AlunosController, ConsentimentoController } from './alunos.controller';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [AlunosController, ConsentimentoController],
  providers: [AlunosService],
})
export class AlunosModule {}
