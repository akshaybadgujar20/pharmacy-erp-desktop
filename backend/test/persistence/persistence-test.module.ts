import { Module } from '@nestjs/common';
import { AuditModule } from '../../src/audit/audit.module';
import { PrismaModule } from '../../src/prisma.module';
import { PersistenceModule } from '../../src/persistence/persistence.module';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
})
export class PersistenceTestModule {}
