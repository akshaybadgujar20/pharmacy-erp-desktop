import { Module } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma.module';
import { PersistenceModule } from '../../src/persistence/persistence.module';

@Module({
  imports: [PrismaModule, PersistenceModule],
})
export class PersistenceTestModule {}
