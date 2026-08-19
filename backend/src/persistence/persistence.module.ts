import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { RequestContextService } from './context/request-context.service';
import { InventoryLedgerService } from './inventory/inventory-ledger.service';
import { OutboxService } from './outbox/outbox.service';
import { SequenceGeneratorService } from './sequence/sequence-generator.service';
import { UnitOfWorkService } from './unit-of-work/unit-of-work.service';

@Module({
  imports: [PrismaModule],
  providers: [
    RequestContextService,
    UnitOfWorkService,
    SequenceGeneratorService,
    OutboxService,
    InventoryLedgerService,
  ],
  exports: [
    RequestContextService,
    UnitOfWorkService,
    SequenceGeneratorService,
    OutboxService,
    InventoryLedgerService,
  ],
})
export class PersistenceModule {}

