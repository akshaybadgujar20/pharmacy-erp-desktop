import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { BatchController } from './controllers/batch.controller';
import { StockAdjustmentController } from './controllers/stock-adjustment.controller';
import { StockAdjustmentItemController } from './controllers/stock-adjustment-item.controller';
import { StockController } from './controllers/stock.controller';
import { StockMovementController } from './controllers/stock-movement.controller';
import { StockTakeController } from './controllers/stock-take.controller';
import { StockTakeItemController } from './controllers/stock-take-item.controller';
import { StockTransferController } from './controllers/stock-transfer.controller';
import { StockTransferItemController } from './controllers/stock-transfer-item.controller';
import { BatchService } from './services/batch.service';
import { StockAdjustmentService } from './services/stock-adjustment.service';
import { StockAdjustmentItemService } from './services/stock-adjustment-item.service';
import { StockService } from './services/stock.service';
import { StockMovementService } from './services/stock-movement.service';
import { StockTakeService } from './services/stock-take.service';
import { StockTakeItemService } from './services/stock-take-item.service';
import { StockTransferService } from './services/stock-transfer.service';
import { StockTransferItemService } from './services/stock-transfer-item.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    BatchController,
    StockController,
    StockMovementController,
    StockAdjustmentController,
    StockAdjustmentItemController,
    StockTransferController,
    StockTransferItemController,
    StockTakeController,
    StockTakeItemController,
  ],
  providers: [
    BatchService,
    StockService,
    StockMovementService,
    StockAdjustmentService,
    StockAdjustmentItemService,
    StockTransferService,
    StockTransferItemService,
    StockTakeService,
    StockTakeItemService,
  ],
  exports: [BatchService],
})
export class InventoryModule {}
