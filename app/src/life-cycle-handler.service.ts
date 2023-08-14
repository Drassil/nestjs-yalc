import { type ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { type IBaseAppOptions } from './base-app.interface.js';
import {
  APP_ALIAS_TOKEN,
  APP_LOGGER_SERVICE,
  APP_OPTION_TOKEN,
} from './def.const.js';
import { AppContextService } from './app-context.service.js';

/**
 * This class is used to handle the lifecycle of the app
 * and apply some common logic and checks to all apps
 */
@Injectable()
export class LifeCycleHandler implements OnModuleDestroy, OnModuleInit {
  /**
   * We do this in the constructor since onModuleInit doesn't seem to be called
   * when we use 'useFactory' to create the provider
   * TODO: investigate why onModuleInit is not called
   *
   * @param logger
   * @param appAlias
   * @param options
   */
  constructor(
    @Inject(APP_LOGGER_SERVICE) private readonly logger: ImprovedLoggerService,
    @Inject(APP_ALIAS_TOKEN) private readonly appAlias: string,
    @Inject(AppContextService)
    private readonly appContextService: AppContextService,
    @Inject(APP_OPTION_TOKEN) private readonly options?: IBaseAppOptions,
  ) {
    this.logger.debug?.(
      `====================== Init ${this.appAlias} ======================`,
    );
    if (
      this.options?.skipDuplicateAppCheck !== true &&
      this.appContextService.initializedApps.has(this.appAlias)
    ) {
      throw new Error(
        `Cannot initialize the same app (${this.appAlias}) twice`,
      );
    }
    this.appContextService.initializedApps.add(this.appAlias);
  }

  onModuleInit() {}

  onModuleDestroy() {
    this.logger.debug?.(
      `====================== Close ${this.appAlias} ======================`,
    );
    this.appContextService.initializedApps.delete(this.appAlias);
  }
}
