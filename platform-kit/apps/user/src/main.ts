import { NestFactory } from '@nestjs/core';
import { YalcAppUserApiModule } from './app-user-api.module.js';

async function bootstrap() {
  const app = await NestFactory.create(YalcAppUserApiModule);
  await app.listen(3000);
}

void bootstrap();
