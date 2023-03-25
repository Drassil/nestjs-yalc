import { Module } from '@nestjs/common';
import { SkeletonCronController } from './sk-cron.controller';
import { SkeletonCronService } from './sk-cron.service';

@Module({
  imports: [],
  controllers: [SkeletonCronController],
  providers: [SkeletonCronService],
})
export class SkeletonCronModule {}
