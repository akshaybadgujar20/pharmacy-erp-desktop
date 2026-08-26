import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../../src/audit/audit.module';
import { PrismaModule } from '../../src/prisma.module';
import { PersistenceModule } from '../../src/persistence/persistence.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PersistenceModule,
    AuditModule,
  ],
})
export class PersistenceTestModule {}
