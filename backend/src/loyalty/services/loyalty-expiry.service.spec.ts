import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyExpiryService } from './loyalty-expiry.service';

describe('LoyaltyExpiryService', () => {
  let service: LoyaltyExpiryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyExpiryService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LoyaltyExpiryService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
