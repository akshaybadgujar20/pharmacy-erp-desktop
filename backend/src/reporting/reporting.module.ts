import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { ReportRegistryService } from './core/report-registry.service';
import { ReportExporterService } from './export/report-exporter.service';
import { FinanceReportsProvider } from './providers/finance/finance-reports.provider';
import { InventoryReportsProvider } from './providers/inventory/inventory-reports.provider';
import { PartyReportsProvider } from './providers/party/party-reports.provider';
import { PurchaseReportsProvider } from './providers/purchase/purchase-reports.provider';
import { SalesReportsProvider } from './providers/sales/sales-reports.provider';
import { ReportController } from './report.controller';
import { ReportFavoriteController } from './report-favorite.controller';
import { ReportFavoriteService } from './report-favorite.service';

@Global()
@Module({
  imports: [PrismaModule, PersistenceModule],
  controllers: [ReportController, ReportFavoriteController],
  providers: [
    ReportFavoriteService,
    ReportRegistryService,
    ReportExporterService,
    PartyReportsProvider,
    SalesReportsProvider,
    PurchaseReportsProvider,
    InventoryReportsProvider,
    FinanceReportsProvider,
  ],
  exports: [ReportRegistryService],
})
export class ReportingModule {}
