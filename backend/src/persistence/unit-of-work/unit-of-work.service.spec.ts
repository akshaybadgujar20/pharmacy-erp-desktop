import { Test, TestingModule } from '@nestjs/testing';
import { UnitOfWorkService } from './unit-of-work.service';

describe('UnitOfWorkService', () => {
  let service: UnitOfWorkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitOfWorkService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(UnitOfWorkService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
