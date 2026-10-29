import 'dotenv/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // Valida tudo que chega: campos desconhecidos são descartados e dados inválidos viram 400.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (erros) =>
        new BadRequestException(
          `Dados inválidos: ${erros.map((e) => e.property).join(', ')}.`,
        ),
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
