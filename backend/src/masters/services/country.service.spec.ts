import { Test, TestingModule } from '@nestjs/testing';
import { CountryService } from './country.service';

describe('CountryService', () => {
  let service: CountryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CountryService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(CountryService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
