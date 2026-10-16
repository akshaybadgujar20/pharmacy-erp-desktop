import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionService } from './role-permission.service';

describe('RolePermissionService', () => {
  let service: RolePermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolePermissionService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(RolePermissionService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
