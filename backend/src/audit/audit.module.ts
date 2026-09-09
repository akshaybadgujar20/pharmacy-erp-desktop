import { Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module';
import { PrismaModule } from '../prisma.module';
import { AuditLogController } from './controllers/audit-log.controller';
import { ChangeHistoryController } from './controllers/change-history.controller';
import { AuditService } from './audit.service';
import { AuditLogService } from './services/audit-log.service';
import { ChangeHistoryService } from './services/change-history.service';

@Module({
  imports: [PrismaModule, PersistenceModule],
  controllers: [AuditLogController, ChangeHistoryController],
  providers: [AuditService, AuditLogService, ChangeHistoryService],
  exports: [AuditService],
})
export class AuditModule {}
