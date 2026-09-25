import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfessoresModule } from './professores/professores.module';
import { AlunosModule } from './alunos/alunos.module';
import { AulasModule } from './aulas/aulas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ProfessoresModule, AlunosModule, AulasModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
