import { Test, TestingModule } from '@nestjs/testing';
import { TaxService } from './tax.service';

describe('TaxService', () => {
  let service: TaxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(TaxService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
