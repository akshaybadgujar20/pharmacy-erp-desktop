import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyProgramService } from './loyalty-program.service';

describe('LoyaltyProgramService', () => {
  let service: LoyaltyProgramService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyProgramService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LoyaltyProgramService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
