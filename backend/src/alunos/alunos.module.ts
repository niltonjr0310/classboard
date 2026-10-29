import { Module } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { AlunosController } from './alunos.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AlunosController],
  providers: [AlunosService],
})
export class AlunosModule {}
