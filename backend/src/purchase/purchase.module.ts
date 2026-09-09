import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { SettingsModule } from '../settings/settings.module';
import { GoodsReceiptController } from './controllers/goods-receipt.controller';
import { GoodsReceiptItemController } from './controllers/goods-receipt-item.controller';
import { PurchaseInvoiceController } from './controllers/purchase-invoice.controller';
import { PurchaseInvoiceItemController } from './controllers/purchase-invoice-item.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { PurchaseOrderItemController } from './controllers/purchase-order-item.controller';
import { PurchaseReturnController } from './controllers/purchase-return.controller';
import { PurchaseReturnItemController } from './controllers/purchase-return-item.controller';
import { GoodsReceiptService } from './services/goods-receipt.service';
import { GoodsReceiptItemService } from './services/goods-receipt-item.service';
import { PurchaseInvoiceService } from './services/purchase-invoice.service';
import { PurchaseInvoiceItemService } from './services/purchase-invoice-item.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { PurchaseOrderItemService } from './services/purchase-order-item.service';
import { PurchaseReturnService } from './services/purchase-return.service';
import { PurchaseReturnItemService } from './services/purchase-return-item.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule, SettingsModule],
  controllers: [
    PurchaseOrderController,
    PurchaseOrderItemController,
    GoodsReceiptController,
    GoodsReceiptItemController,
    PurchaseInvoiceController,
    PurchaseInvoiceItemController,
    PurchaseReturnController,
    PurchaseReturnItemController,
  ],
  providers: [
    PurchaseOrderService,
    PurchaseOrderItemService,
    GoodsReceiptService,
    GoodsReceiptItemService,
    PurchaseInvoiceService,
    PurchaseInvoiceItemService,
    PurchaseReturnService,
    PurchaseReturnItemService,
  ],
})
export class PurchaseModule {}
