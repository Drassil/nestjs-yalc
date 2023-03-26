import { Module } from '@nestjs/common';
import { SkeletonCronController } from './cron.controller.js';
import { SkeletonCronService } from './cron.service.js';

@Module({
  imports: [],
  controllers: [SkeletonCronController],
  providers: [SkeletonCronService],
})
export class SkeletonCronModule {}
