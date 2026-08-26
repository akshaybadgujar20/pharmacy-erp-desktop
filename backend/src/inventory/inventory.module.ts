import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { BatchController } from './controllers/batch.controller';
import { BatchService } from './services/batch.service';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';
import { StockMovementController } from './controllers/stock-movement.controller';
import { StockAdjustmentController } from './controllers/stock-adjustment.controller';
import { StockAdjustmentService } from './services/stock-adjustment.service';
import { StockTransferController } from './controllers/stock-transfer.controller';
import { StockMovementService } from './services/stock-movement.service';
import { StockTransferService } from './services/stock-transfer.service';
import { StockTakeService } from './services/stock-take.service';
import { StockTakeController } from './controllers/stock-take.controller';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    BatchController,
    StockController,
    StockAdjustmentController,
    StockMovementController,
    StockTransferController,
    StockTakeController,
  ],
  providers: [
    BatchService,
    StockService,
    StockAdjustmentService,
    StockMovementService,
    StockTransferService,
    StockTakeService,
  ],
  exports: [],
})
export class InventoryModule {}
