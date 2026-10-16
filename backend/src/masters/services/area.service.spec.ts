import { Test, TestingModule } from '@nestjs/testing';
import { AreaService } from './area.service';

describe('AreaService', () => {
  let service: AreaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AreaService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(AreaService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
