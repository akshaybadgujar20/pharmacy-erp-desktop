jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'TEST_SECRET'),
  generateURI: jest.fn(() => 'otpauth://test'),
  verify: jest.fn(async () => true),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { MfaService } from './mfa.service';

describe('MfaService', () => {
  let service: MfaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MfaService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MfaService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
