import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class InventoryModule {}
