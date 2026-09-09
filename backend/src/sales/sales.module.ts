import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsModule } from '../settings/settings.module';
import { SalesInvoiceController } from './controllers/sales-invoice.controller';
import { SalesInvoiceItemController } from './controllers/sales-invoice-item.controller';
import { SalesPaymentController } from './controllers/sales-payment.controller';
import { SalesReturnController } from './controllers/sales-return.controller';
import { SalesReturnItemController } from './controllers/sales-return-item.controller';
import { SalesInvoiceService } from './services/sales-invoice.service';
import { SalesInvoiceItemService } from './services/sales-invoice-item.service';
import { SalesPaymentService } from './services/sales-payment.service';
import { SalesReturnService } from './services/sales-return.service';
import { SalesReturnItemService } from './services/sales-return-item.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule, SettingsModule],
  controllers: [
    SalesInvoiceController,
    SalesInvoiceItemController,
    SalesPaymentController,
    SalesReturnController,
    SalesReturnItemController,
  ],
  providers: [
    SalesInvoiceService,
    SalesInvoiceItemService,
    SalesPaymentService,
    SalesReturnService,
    SalesReturnItemService,
  ],
})
export class SalesModule {}
