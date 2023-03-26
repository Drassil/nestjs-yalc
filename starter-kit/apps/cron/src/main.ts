import { NestFactory } from '@nestjs/core';
import { SkeletonCronModule } from './cron.module.js';

async function bootstrap() {
  const app = await NestFactory.create(SkeletonCronModule);
  await app.listen(3000);
}

void bootstrap();
