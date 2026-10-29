import { Module } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { RelatoriosController } from './relatorios.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
