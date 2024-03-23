import { NestFactory } from '@nestjs/core';
import { YalcPlatformAppModule } from './platform.module.js';

async function bootstrap() {
  const app = await NestFactory.create(YalcPlatformAppModule);
  await app.listen(3000);
}

void bootstrap();
