import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { ErrorCode } from '../common/exceptions/error-code';
import { RequestContextService } from '../persistence/context/request-context.service';
import type { TxClient } from '../persistence/prisma/prisma-tx.type';
import { AuditAction } from './audit-action.constants';
import { AuditModule as AuditModuleName } from './audit-module.constants';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let auditService: AuditService;
  let requestContext: RequestContextService;
  let auditLogCreate: jest.Mock;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, RequestContextService],
    }).compile();

    auditService = moduleRef.get(AuditService);
    requestContext = moduleRef.get(RequestContextService);
    auditLogCreate = jest.fn().mockResolvedValue({ id: 1n });
  });

  it('writes audit row with request context fields', async () => {
    const tx = { auditLog: { create: auditLogCreate } } as unknown as TxClient;

    await requestContext.run(
      {
        companyId: 1n,
        branchId: 2n,
        userId: 25n,
        deviceId: 'device-1',
        correlationId: 'corr-123',
        ipAddress: '127.0.0.1',
        sessionId: 'session-1',
      },
      async () => {
        await auditService.log(tx, {
          entityType: 'SalesInvoice',
          entityId: 501n,
          action: AuditAction.POST,
          module: AuditModuleName.SALES,
          description: 'Sales invoice posted',
        });
      },
    );

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const createArgs = (
      auditLogCreate.mock.calls as Array<
        [
          {
            data: {
              userId: bigint;
              companyId: bigint;
              branchId: bigint;
              entityType: string;
              entityId: bigint;
              action: string;
              module: string;
              description: string;
              deviceId: string;
              correlationId: string;
              ipAddress: string;
              sessionId: string;
              actionTimestamp: Date;
            };
          },
        ]
      >
    )[0][0];

    expect(createArgs.data.userId).toBe(25n);
    expect(createArgs.data.companyId).toBe(1n);
    expect(createArgs.data.branchId).toBe(2n);
    expect(createArgs.data.entityType).toBe('SalesInvoice');
    expect(createArgs.data.entityId).toBe(501n);
    expect(createArgs.data.action).toBe(AuditAction.POST);
    expect(createArgs.data.module).toBe(AuditModuleName.SALES);
    expect(createArgs.data.description).toBe('Sales invoice posted');
    expect(createArgs.data.deviceId).toBe('device-1');
    expect(createArgs.data.correlationId).toBe('corr-123');
    expect(createArgs.data.ipAddress).toBe('127.0.0.1');
    expect(createArgs.data.sessionId).toBe('session-1');
    expect(createArgs.data.actionTimestamp).toBeInstanceOf(Date);
  });

  it('rejects empty entityType', async () => {
    const tx = { auditLog: { create: auditLogCreate } } as unknown as TxClient;

    await expect(
      auditService.log(tx, {
        entityType: '   ',
        action: AuditAction.CREATE,
        module: AuditModuleName.PARTY,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('rejects invalid action', async () => {
    const tx = { auditLog: { create: auditLogCreate } } as unknown as TxClient;

    await expect(
      auditService.log(tx, {
        entityType: 'Customer',
        action: 'INVALID' as AuditAction,
        module: AuditModuleName.PARTY,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('rejects invalid module', async () => {
    const tx = { auditLog: { create: auditLogCreate } } as unknown as TxClient;

    await expect(
      auditService.log(tx, {
        entityType: 'Customer',
        action: AuditAction.CREATE,
        module: 'InvalidModule' as AuditModuleName,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });
});
