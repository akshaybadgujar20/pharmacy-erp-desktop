import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FinanceModule } from '../finance/finance.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { BarcodeConfigurationController } from './controllers/barcode-configuration.controller';
import { BranchController } from './controllers/branch.controller';
import { CompanyController } from './controllers/company.controller';
import { FinancialYearController } from './controllers/financial-year.controller';
import { PrinterConfigurationController } from './controllers/printer-configuration.controller';
import { SequenceGeneratorController } from './controllers/sequence-generator.controller';
import { BarcodeConfigurationService } from './services/barcode-configuration.service';
import { BranchService } from './services/branch.service';
import { CompanyService } from './services/company.service';
import { FinancialYearService } from './services/financial-year.service';
import { PrinterConfigurationService } from './services/printer-configuration.service';
import { SequenceGeneratorConfigService } from './services/sequence-generator-config.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule, FinanceModule],
  controllers: [
    CompanyController,
    BranchController,
    FinancialYearController,
    SequenceGeneratorController,
    PrinterConfigurationController,
    BarcodeConfigurationController,
  ],
  providers: [
    CompanyService,
    BranchService,
    FinancialYearService,
    SequenceGeneratorConfigService,
    PrinterConfigurationService,
    BarcodeConfigurationService,
  ],
  exports: [CompanyService, BranchService, FinancialYearService],
})
export class ConfigurationModule {}
