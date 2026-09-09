import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { ManufacturerController } from './controllers/manufacturer.controller';
import { MedicineCategoryController } from './controllers/medicine-category.controller';
import { MedicineGenericController } from './controllers/medicine-generic.controller';
import { MedicineSaltController } from './controllers/medicine-salt.controller';
import { MedicineScheduleController } from './controllers/medicine-schedule.controller';
import { MedicineController } from './controllers/medicine.controller';
import { SaltCompositionController } from './controllers/salt-composition.controller';
import { UnitOfMeasureController } from './controllers/unit-of-measure.controller';
import { ManufacturerService } from './services/manufacturer.service';
import { MedicineCategoryService } from './services/medicine-category.service';
import { MedicineGenericService } from './services/medicine-generic.service';
import { MedicineSaltService } from './services/medicine-salt.service';
import { MedicineScheduleService } from './services/medicine-schedule.service';
import { MedicineService } from './services/medicine.service';
import { SaltCompositionService } from './services/salt-composition.service';
import { UnitOfMeasureService } from './services/unit-of-measure.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    UnitOfMeasureController,
    MedicineScheduleController,
    MedicineCategoryController,
    MedicineGenericController,
    SaltCompositionController,
    ManufacturerController,
    MedicineController,
    MedicineSaltController,
  ],
  providers: [
    UnitOfMeasureService,
    MedicineScheduleService,
    MedicineCategoryService,
    MedicineGenericService,
    SaltCompositionService,
    ManufacturerService,
    MedicineService,
    MedicineSaltService,
  ],
  exports: [MedicineService],
})
export class MedicineModule {}
