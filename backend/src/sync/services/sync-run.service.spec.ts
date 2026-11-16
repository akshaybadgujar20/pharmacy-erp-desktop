import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { SyncCloudClient } from '../cloud/sync-cloud.client';
import { DeviceSyncStateService } from './device-sync-state.service';
import { SyncApplyService } from './sync-apply.service';
import { SyncOutboxExpandService } from './sync-outbox-expand.service';
import { SyncRunService } from './sync-run.service';

describe('SyncRunService', () => {
  let service: SyncRunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncRunService,
        {
          provide: PrismaService,
          useValue: { client: {} },
        },
        {
          provide: UnitOfWorkService,
          useValue: {
            run: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
          },
        },
        {
          provide: RequestContextService,
          useValue: {
            getDeviceId: () => 'desktop-dev-001',
            get: () => ({ deviceId: 'desktop-dev-001', branchId: 1n }),
            tryGet: () => ({ deviceId: 'desktop-dev-001', branchId: 1n }),
          },
        },
        {
          provide: SyncCloudClient,
          useValue: { pushBatch: jest.fn(), pullDelta: jest.fn() },
        },
        {
          provide: DeviceSyncStateService,
          useValue: {
            getOrCreateForCurrentContext: jest.fn(),
            touchPushAt: jest.fn(),
          },
        },
        {
          provide: SyncApplyService,
          useValue: {
            applyPullRecord: jest.fn(),
            applyServerWinFromPush: jest.fn(),
            recordConflict: jest.fn(),
          },
        },
        {
          provide: SyncOutboxExpandService,
          useValue: { expand: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SyncRunService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
