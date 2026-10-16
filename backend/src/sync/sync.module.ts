import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { OutboxController } from './controllers/outbox.controller';
import { SyncConflictController } from './controllers/sync-conflict.controller';
import { SyncLogController } from './controllers/sync-log.controller';
import { SyncRunController } from './controllers/sync-run.controller';
import { OutboxAdminService } from './services/outbox-admin.service';
import { SyncConflictService } from './services/sync-conflict.service';
import { SyncLogService } from './services/sync-log.service';
import { SyncRunService } from './services/sync-run.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    OutboxController,
    SyncLogController,
    SyncConflictController,
    SyncRunController,
  ],
  providers: [
    OutboxAdminService,
    SyncLogService,
    SyncConflictService,
    SyncRunService,
  ],
})
export class SyncModule {}
