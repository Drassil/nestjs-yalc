import {
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_LOGGER_SERVICE } from '@nestjs-yalc/app/def.const';
import { AppEvents } from './app.events';

/**
 * Application service
 */
@Injectable()
export class BaseAppService {
  constructor(@Inject(APP_LOGGER_SERVICE) protected logger: LoggerService) {}

  /**
   * Hello world function
   */
  getHello(appName: string): string {
    return `Hello World from ${appName}!`;
  }

  @OnEvent(AppEvents.BEFORE_ALL_ROUTES)
  handleBeforeAllRoutes(context: ExecutionContext) {
    const handlerName = context.getHandler().name;
    // exclude special handlers such as _service
    if (!handlerName.startsWith('_') && handlerName.includes('_'))
      this.logger.debug?.(`Running Handler: ${handlerName}`);
  }
}
