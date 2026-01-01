import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import AppConfig from './config/app.config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(AppConfig.PORT);
}
void bootstrap();
