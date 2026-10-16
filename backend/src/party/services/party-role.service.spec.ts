import { Test, TestingModule } from '@nestjs/testing';
import { PartyRoleService } from './party-role.service';

describe('PartyRoleService', () => {
  let service: PartyRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartyRoleService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PartyRoleService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
