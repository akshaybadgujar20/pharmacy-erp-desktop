import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyEnrollmentService } from './loyalty-enrollment.service';

describe('LoyaltyEnrollmentService', () => {
  let service: LoyaltyEnrollmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyEnrollmentService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LoyaltyEnrollmentService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
