import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PrescriptionStatus } from '../constants/prescription.constants';
import { PrescriptionService } from './prescription.service';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let unitOfWork: { run: jest.Mock };
  let auditService: { log: jest.Mock; logFieldChanges: jest.Mock };
  let tx: {
    prescription: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
    prescriptionItem: { count: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      prescription: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1n,
          uuid: 'rx-uuid',
          status: PrescriptionStatus.DRAFT,
          remarks: null,
          prescriptionNumber: 'RX-001',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirstOrThrow: jest.fn(),
      },
      prescriptionItem: { count: jest.fn().mockResolvedValue(0) },
    };

    unitOfWork = {
      run: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    auditService = { log: jest.fn(), logFieldChanges: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionService,
        { provide: PrismaService, useValue: { client: {} } },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: { enqueue: jest.fn() } },
        {
          provide: RequestContextService,
          useValue: {
            get: jest.fn().mockReturnValue({ companyId: 1n, branchId: 2n }),
          },
        },
      ],
    }).compile();

    service = module.get(PrescriptionService);
  });

  it('activate rejects prescriptions with no items', async () => {
    await expect(service.activate(1n, { version: 1 })).rejects.toMatchObject({
      code: ErrorCode.DOCUMENT_HAS_NO_ITEMS,
      statusCode: HttpStatus.BAD_REQUEST,
    });

    expect(tx.prescription.updateMany).not.toHaveBeenCalled();
  });
});
