import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { AreaController } from './controllers/area.controller';
import { CityController } from './controllers/city.controller';
import { CountryController } from './controllers/country.controller';
import { MastersImportController } from './controllers/masters-import.controller';
import { StateController } from './controllers/state.controller';
import { AreaService } from './services/area.service';
import { CityService } from './services/city.service';
import { CountryService } from './services/country.service';
import { MastersImportService } from './services/masters-import.service';
import { StateService } from './services/state.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [
    CountryController,
    StateController,
    CityController,
    AreaController,
    MastersImportController,
  ],
  providers: [
    CountryService,
    StateService,
    CityService,
    AreaService,
    MastersImportService,
  ],
})
export class MastersModule {}
