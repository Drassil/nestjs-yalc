import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * This service is used to access the app config registered with a specific app alias.
 * This is useful when you want to access the config of the current app with the dependency injection and
 * without specifying the app alias.
 */
export class AppConfigService<T = any> {
  protected config: T;

  constructor(
    public readonly originalService: ConfigService,
    protected readonly appAlias: string,
  ) {
    const config = this.originalService.get<T>(this.appAlias);
    if (!config) {
      throw new Error(
        `AppConfigService: No config found for app alias '${this.appAlias}'`,
      );
    }

    this.config = config;
  }

  get(): T {
    return this.config;
  }
}

export function createAppConfigProvider(appAlias: string): Provider {
  return {
    provide: `${appAlias}Config`,
    useFactory: (config: ConfigService): AppConfigService => {
      return new AppConfigService(config, appAlias);
    },
    inject: [ConfigService],
  };
}

export function getAppConfigToken(appAlias: string): string {
  return `${appAlias}Config`;
}
