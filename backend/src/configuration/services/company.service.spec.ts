import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(CompanyService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
