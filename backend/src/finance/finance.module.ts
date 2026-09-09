import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { PrismaModule } from '../prisma.module';
import { LedgerController } from './controllers/ledger.controller';
import { LedgerEntryController } from './controllers/ledger-entry.controller';
import { PaymentController } from './controllers/payment.controller';
import { ReceiptController } from './controllers/receipt.controller';
import { LedgerService } from './services/ledger.service';
import { LedgerEntryService } from './services/ledger-entry.service';
import { PaymentService } from './services/payment.service';
import { ReceiptService } from './services/receipt.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    LedgerController,
    LedgerEntryController,
    PaymentController,
    ReceiptController,
  ],
  providers: [
    LedgerService,
    LedgerEntryService,
    PaymentService,
    ReceiptService,
  ],
  exports: [LedgerService, PaymentService, ReceiptService],
})
export class FinanceModule {}
