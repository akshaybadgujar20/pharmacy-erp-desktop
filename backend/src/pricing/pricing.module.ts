import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { DiscountRuleController } from './controllers/discount-rule.controller';
import { PriceListItemController } from './controllers/price-list-item.controller';
import { PriceListController } from './controllers/price-list.controller';
import { TaxController } from './controllers/tax.controller';
import { DiscountRuleService } from './services/discount-rule.service';
import { PriceListItemService } from './services/price-list-item.service';
import { PriceListService } from './services/price-list.service';
import { TaxService } from './services/tax.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    TaxController,
    DiscountRuleController,
    PriceListController,
    PriceListItemController,
  ],
  providers: [
    TaxService,
    DiscountRuleService,
    PriceListService,
    PriceListItemService,
  ],
  exports: [PriceListService],
})
export class PricingModule {}
