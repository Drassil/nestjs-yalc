import { Global, Module } from '@nestjs/common';
import { AppContextService } from './app-context.service.js';

@Global()
@Module({ providers: [AppContextService], exports: [AppContextService] })
export class AppContextModule {}
