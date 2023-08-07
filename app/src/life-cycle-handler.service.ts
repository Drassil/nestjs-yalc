import { type ImprovedLoggerService } from '@nestjs-yalc/logger/logger-abstract.service.js';
import { Injectable, Inject } from '@nestjs/common';
import { type IBaseAppOptions } from './base-app.interface.js';
import { APP_LOGGER_SERVICE } from './def.const.js';

const initializedApps = new Set<string>();

/**
 * This class is used to handle the lifecycle of the app
 * and apply some common logic and checks to all apps
 */
@Injectable()
export class LifeCycleHandler {
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
    private readonly appAlias: string,
    private readonly options?: IBaseAppOptions,
  ) {
    this.logger.debug?.(
      `====================== Init ${appAlias} ======================`,
    );
    if (
      this.options?.skipDuplicateAppCheck !== true &&
      initializedApps.has(this.appAlias)
    ) {
      throw new Error(
        `Cannot initialize the same app (${this.appAlias}) twice`,
      );
    }
    initializedApps.add(this.appAlias);
  }

  onModuleDestroy() {
    this.logger.debug?.(
      `====================== Close ${this.appAlias} ======================`,
    );
    initializedApps.delete(this.appAlias);
  }
}
