import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { PrescriptionItemController } from './controllers/prescription-item.controller';
import { PrescriptionController } from './controllers/prescription.controller';
import { PrescriptionItemService } from './services/prescription-item.service';
import { PrescriptionService } from './services/prescription.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [PrescriptionController, PrescriptionItemController],
  providers: [PrescriptionService, PrescriptionItemService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
