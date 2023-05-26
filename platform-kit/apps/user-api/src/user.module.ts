import { Module } from '@nestjs/common';
import { AppController } from './user.controller.js';
import { AppService } from './user.service.js';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
