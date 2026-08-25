import { Module } from '@nestjs/common';

import { PersistenceModule } from '../persistence/persistence.module';
import { AuditService } from './audit.service';

@Module({
  imports: [PersistenceModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
