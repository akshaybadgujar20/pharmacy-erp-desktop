import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleService } from './user-role.service';

describe('UserRoleService', () => {
  let service: UserRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRoleService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(UserRoleService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
