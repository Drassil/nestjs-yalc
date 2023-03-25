import { Controller, Get } from '@nestjs/common';
import { SkeletonCronService } from './sk-cron.service';

@Controller()
export class SkeletonCronController {
  constructor(private readonly skeletonCronService: SkeletonCronService) {}

  @Get()
  getHello(): string {
    return this.skeletonCronService.getHello();
  }
}
