import { Test, TestingModule } from '@nestjs/testing';
import { UnitOfMeasureService } from './unit-of-measure.service';

describe('UnitOfMeasureService', () => {
  let service: UnitOfMeasureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitOfMeasureService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(UnitOfMeasureService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
