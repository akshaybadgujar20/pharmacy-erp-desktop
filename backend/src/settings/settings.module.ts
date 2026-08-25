import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { PrismaModule } from '../prisma.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule, PersistenceModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
