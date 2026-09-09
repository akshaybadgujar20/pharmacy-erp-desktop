import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { OutboxController } from './controllers/outbox.controller';
import { SyncConflictController } from './controllers/sync-conflict.controller';
import { SyncLogController } from './controllers/sync-log.controller';
import { OutboxService } from './services/outbox.service';
import { SyncConflictService } from './services/sync-conflict.service';
import { SyncLogService } from './services/sync-log.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [OutboxController, SyncLogController, SyncConflictController],
  providers: [OutboxService, SyncLogService, SyncConflictService],
})
export class SyncModule {}
