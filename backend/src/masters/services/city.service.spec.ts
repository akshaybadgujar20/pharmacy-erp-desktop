import { Test, TestingModule } from '@nestjs/testing';
import { CityService } from './city.service';

describe('CityService', () => {
  let service: CityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CityService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(CityService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
