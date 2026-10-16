import { Test, TestingModule } from '@nestjs/testing';
import { ManufacturerService } from './manufacturer.service';

describe('ManufacturerService', () => {
  let service: ManufacturerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManufacturerService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(ManufacturerService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
