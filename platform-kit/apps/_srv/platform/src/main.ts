import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../user/src/user.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

void bootstrap();
