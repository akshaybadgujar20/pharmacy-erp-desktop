import { Test, TestingModule } from '@nestjs/testing';
import { DiscountRuleService } from './discount-rule.service';

describe('DiscountRuleService', () => {
  let service: DiscountRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscountRuleService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(DiscountRuleService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
