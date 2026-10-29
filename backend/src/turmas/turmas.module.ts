import { Module } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { TurmasController } from './turmas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TurmasController],
  providers: [TurmasService],
})
export class TurmasModule {}
