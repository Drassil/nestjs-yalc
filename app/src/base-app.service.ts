import * as common from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_LOGGER_SERVICE } from '@nestjs-yalc/app/def.const.js';
import { AppEvents } from './app.events.js';

/**
 * Application service
 */
@common.Injectable()
export class BaseAppService {
  constructor(
    @common.Inject(APP_LOGGER_SERVICE) protected logger: common.LoggerService,
  ) {}

  /**
   * Hello world function
   */
  getHello(appName: string): string {
    return `Hello World from ${appName}!`;
  }

  @OnEvent(AppEvents.BEFORE_ALL_ROUTES)
  handleBeforeAllRoutes(context: common.ExecutionContext) {
    const handlerName = context.getHandler().name;
    // exclude special handlers such as _service
    if (!handlerName.startsWith('_') && handlerName.includes('_'))
      this.logger.debug?.(`Running Handler: ${handlerName}`);
  }
}
