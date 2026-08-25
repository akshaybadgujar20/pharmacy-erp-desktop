import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';

import { PersistenceModule } from '../../persistence/persistence.module';
import { AppLogger } from './app-logger.service';
import { CorrelationMiddleware } from './correlation.middleware';
import { LoggingInterceptor } from './logging.interceptor';
import { buildWinstonModuleOptions } from './winston.config';

@Module({
  imports: [
    ConfigModule,
    PersistenceModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildWinstonModuleOptions(configService),
    }),
  ],
  providers: [AppLogger, CorrelationMiddleware, LoggingInterceptor],
  exports: [
    AppLogger,
    CorrelationMiddleware,
    LoggingInterceptor,
    WinstonModule,
  ],
})
export class LoggingModule {}
