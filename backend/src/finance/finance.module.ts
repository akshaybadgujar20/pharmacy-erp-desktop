import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { PrismaModule } from '../prisma.module';
import { ClosingController } from './controllers/closing.controller';
import { LedgerController } from './controllers/ledger.controller';
import { LedgerEntryController } from './controllers/ledger-entry.controller';
import { PaymentController } from './controllers/payment.controller';
import { ReceiptController } from './controllers/receipt.controller';
import { ClosingService } from './services/closing.service';
import { LedgerService } from './services/ledger.service';
import { LedgerEntryService } from './services/ledger-entry.service';
import { PaymentService } from './services/payment.service';
import { ReceiptService } from './services/receipt.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    ClosingController,
    LedgerController,
    LedgerEntryController,
    PaymentController,
    ReceiptController,
  ],
  providers: [
    ClosingService,
    LedgerService,
    LedgerEntryService,
    PaymentService,
    ReceiptService,
  ],
  exports: [LedgerService, PaymentService, ReceiptService, ClosingService],
})
export class FinanceModule {}
