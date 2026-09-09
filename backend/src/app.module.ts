import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';

import { AppService } from './app.service';

import { AuditModule } from './audit/audit.module';

import { AuthModule } from './auth/auth.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { PermissionsGuard } from './auth/guards/permissions.guard';

import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';

import { ContextEnrichInterceptor } from './common/interceptors/context-enrich.interceptor';

import { CorrelationMiddleware } from './common/logging/correlation.middleware';

import { LoggingInterceptor } from './common/logging/logging.interceptor';

import { LoggingModule } from './common/logging/logging.module';

import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { PrismaModule } from './prisma.module';

import { PersistenceModule } from './persistence/persistence.module';

import { SettingsModule } from './settings/settings.module';
import { PartyModule } from './party/party.module';
import { ReportingModule } from './reporting/reporting.module';
import { InventoryModule } from './inventory/inventory.module';
import { PurchaseModule } from './purchase/purchase.module';
import { FinanceModule } from './finance/finance.module';
import { SalesModule } from './sales/sales.module';
import { SecurityModule } from './security/security.module';
import { MedicineModule } from './medicine/medicine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PersistenceModule,
    LoggingModule,
    AuditModule,
    AuthModule,
    SettingsModule,
    PartyModule,
    InventoryModule,
    PurchaseModule,
    FinanceModule,
    SalesModule,
    SecurityModule,
    MedicineModule,
    ReportingModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ContextEnrichInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
