import { Test, TestingModule } from '@nestjs/testing';
import { SaltCompositionService } from './salt-composition.service';

describe('SaltCompositionService', () => {
  let service: SaltCompositionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaltCompositionService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SaltCompositionService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
