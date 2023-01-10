import { IServiceConf } from '@nestjs-yalc/app/conf.type';
import { CURAPP_CONF_ALIAS } from '@nestjs-yalc/app/def.const';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAppService } from './base-app.service';
import { ApiOperation } from '@nestjs/swagger';

/**
 * Application controller
 */
@Controller()
export abstract class BaseAppController {
  constructor(
    protected readonly appService: BaseAppService,
    protected readonly configService: ConfigService,
  ) {}

  /**
   * Expose the getHello method
   */
  @Get()
  getHello(): string {
    const conf = this.configService.get<IServiceConf>(CURAPP_CONF_ALIAS);
    return this.appService.getHello(conf?.appName || 'no-name');
  }

  /**
   * Only for dev purpose
   */
  @ApiOperation({
    description:
      'Shutdown the application, only available on development and test environment',
  })
  @Get('shutdown')
  shutdown() {
    const conf = this.configService.get<IServiceConf>(CURAPP_CONF_ALIAS);
    if (conf && (conf.isDev || conf.isTest)) {
      // eslint-disable-next-line no-console
      console.log(`Bye bye!`);
      process.exit(0);
    }
  }
}
