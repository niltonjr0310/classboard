import { Module } from '@nestjs/common';
import { ProfessoresService } from './professores.service';
import { ProfessoresController } from './professores.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProfessoresController],
  providers: [ProfessoresService],
})
export class ProfessoresModule {}
