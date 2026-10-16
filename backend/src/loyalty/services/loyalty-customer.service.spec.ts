import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyCustomerService } from './loyalty-customer.service';

describe('LoyaltyCustomerService', () => {
  let service: LoyaltyCustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyCustomerService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LoyaltyCustomerService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
