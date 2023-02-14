import { ConfigService } from '@nestjs/config';

/**
 * This service is used to access the app config registered with a specific app alias.
 * This is useful when you want to access the config of the current app with the dependency injection and
 * without specifying the app alias.
 */
export class AppConfigService<T = any> {
  constructor(
    protected readonly configService: ConfigService,
    protected readonly appAlias: string,
  ) {}

  get(): T | undefined {
    return this.configService.get<T>(this.appAlias);
  }
}

export function AppConfigServiceFactory(appAlias: string) {
  return {
    provide: AppConfigService,
    useFactory: (config: ConfigService): AppConfigService => {
      return new AppConfigService(config, appAlias);
    },
    inject: [ConfigService],
  };
}
