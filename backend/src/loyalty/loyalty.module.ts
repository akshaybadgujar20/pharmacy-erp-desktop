import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { LoyaltyEnrollmentController } from './controllers/loyalty-enrollment.controller';
import { LoyaltyProgramController } from './controllers/loyalty-program.controller';
import { LoyaltyEnrollmentService } from './services/loyalty-enrollment.service';
import { LoyaltyIntegrationService } from './services/loyalty-integration.service';
import { LoyaltyProgramService } from './services/loyalty-program.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule],
  controllers: [LoyaltyProgramController, LoyaltyEnrollmentController],
  providers: [
    LoyaltyProgramService,
    LoyaltyEnrollmentService,
    LoyaltyIntegrationService,
  ],
  exports: [LoyaltyIntegrationService],
})
export class LoyaltyModule {}
