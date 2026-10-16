import { Test, TestingModule } from '@nestjs/testing';
import { BranchService } from './branch.service';

describe('BranchService', () => {
  let service: BranchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(BranchService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
