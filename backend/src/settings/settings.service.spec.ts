import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { ErrorCode } from '../common/exceptions/error-code';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { RequestContextService } from '../persistence/context/request-context.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { SettingDataType } from './setting-keys.constants';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: {
    appSetting: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findFirstOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let requestContext: { get: jest.Mock };
  let unitOfWork: { run: jest.Mock };
  let auditService: { log: jest.Mock; logFieldChanges: jest.Mock };
  let outboxService: { enqueue: jest.Mock };

  beforeEach(async () => {
    prisma = {
      appSetting: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    requestContext = {
      get: jest.fn().mockReturnValue({ companyId: 1n, branchId: 2n }),
    };

    unitOfWork = {
      run: jest.fn((fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(1n),
      logFieldChanges: jest.fn().mockResolvedValue(undefined),
    };

    outboxService = {
      enqueue: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: RequestContextService, useValue: requestContext },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get(SettingsService);
  });

  it('falls back to company-level setting when branch setting is missing', async () => {
    prisma.appSetting.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 10n,
        settingValue: '18',
        dataType: SettingDataType.DECIMAL,
        isEditable: true,
      });

    const value = await service.getString('gst.default_rate');

    expect(value).toBe('18');
    expect(prisma.appSetting.findFirst).toHaveBeenCalledTimes(2);
  });

  it('returns empty string when setting value is empty', async () => {
    prisma.appSetting.findFirst.mockResolvedValue({
      id: 10n,
      settingValue: '',
      dataType: SettingDataType.STRING,
      isEditable: true,
    });

    await expect(service.getString('store.display_name')).resolves.toBe('');
  });

  it('throws NOT_FOUND when setting does not exist', async () => {
    prisma.appSetting.findFirst.mockResolvedValue(null);

    await expect(service.getString('missing.key')).rejects.toMatchObject({
      code: ErrorCode.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('coerces numeric settings', async () => {
    prisma.appSetting.findFirst.mockResolvedValue({
      id: 11n,
      settingValue: '12.5',
      dataType: SettingDataType.DECIMAL,
      isEditable: true,
    });

    const value = await service.getNumber('gst.default_rate');

    expect(value).toBe(12.5);
  });

  it('parses boolean settings case-insensitively', async () => {
    prisma.appSetting.findFirst.mockResolvedValue({
      id: 11n,
      settingValue: 'TRUE',
      dataType: SettingDataType.BOOLEAN,
      isEditable: true,
    });

    await expect(service.getBoolean('fefo.enabled')).resolves.toBe(true);
  });

  it('rejects update when setting is not editable', async () => {
    prisma.appSetting.findFirst.mockResolvedValue({
      id: 12n,
      settingValue: 'locked',
      dataType: SettingDataType.STRING,
      isEditable: false,
      version: 1,
    });

    await expect(
      service.updateSetting('locked.key', 'new-value'),
    ).rejects.toMatchObject({
      code: ErrorCode.APP_SETTING_NOT_EDITABLE,
      statusCode: HttpStatus.FORBIDDEN,
    });
  });

  it('rejects invalid boolean values on update', async () => {
    prisma.appSetting.findFirst.mockResolvedValue({
      id: 13n,
      uuid: 'setting-uuid',
      settingValue: 'true',
      dataType: SettingDataType.BOOLEAN,
      isEditable: true,
      version: 1,
    });

    await expect(
      service.updateSetting('fefo.enabled', 'maybe'),
    ).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_ERROR,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });
});
