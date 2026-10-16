import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(RoleService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
