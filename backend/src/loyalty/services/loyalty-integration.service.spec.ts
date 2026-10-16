import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyIntegrationService } from './loyalty-integration.service';

describe('LoyaltyIntegrationService', () => {
  let service: LoyaltyIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyIntegrationService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LoyaltyIntegrationService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
