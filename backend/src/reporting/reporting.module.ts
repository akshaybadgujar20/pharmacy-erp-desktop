import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { ReportRegistryService } from './core/report-registry.service';
import { ReportExporterService } from './export/report-exporter.service';
import { PartyReportsProvider } from './providers/party/party-reports.provider';
import { ReportController } from './report.controller';

@Global()
@Module({
  imports: [PrismaModule, PersistenceModule],
  controllers: [ReportController],
  providers: [
    ReportRegistryService,
    ReportExporterService,
    PartyReportsProvider,
  ],
  exports: [ReportRegistryService],
})
export class ReportingModule {}
