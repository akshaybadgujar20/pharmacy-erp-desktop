import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaModule } from './prisma.module';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [PrismaModule, PersistenceModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
