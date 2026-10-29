import { Module } from '@nestjs/common';
import { EscolasService } from './escolas.service';
import { EscolasController } from './escolas.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EscolasController],
  providers: [EscolasService],
})
export class EscolasModule {}
