import { Test, TestingModule } from '@nestjs/testing';
import { FinancialYearService } from './financial-year.service';

describe('FinancialYearService', () => {
  let service: FinancialYearService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialYearService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(FinancialYearService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
