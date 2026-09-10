import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppSetting } from '@prisma/client';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { auditAndLogChanges } from '../audit/utils/audit.util';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { RequestContextService } from '../persistence/context/request-context.service';
import {
  assertBranchInCompany,
  buildCompanyBranchFilter,
} from '../persistence/context/branch-scope.util';
import { getTenantScope } from '../persistence/context/tenant-scope.util';
import { OutboxEntityType } from '../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../persistence/outbox/outbox.service';
import type { TxClient } from '../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingDataType } from './setting-keys.constants';
import { AppSettingResponse, toAppSettingResponse } from './settings.mapper';
import { optimisticUpdate } from './utils/settings.util';

const APP_SETTING_AUDIT_FIELDS = [{ name: 'settingValue' }];

interface CachedSetting {
  row: {
    id: bigint;
    settingValue: string | null;
    dataType: string;
    isEditable: boolean;
  };
  expiresAt: number;
}

@Injectable()
export class SettingsService {
  private readonly cache = new Map<string, CachedSetting>();
  private readonly cacheTtlMs = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async listByCategory(category?: string): Promise<AppSettingResponse[]> {
    const { companyId, branchId } = getTenantScope(this.requestContext);

    const rows = await this.prisma.client.appSetting.findMany({
      where: {
        companyId,
        ...buildCompanyBranchFilter(branchId),
        isActive: true,
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { settingKey: 'asc' }],
    });

    return this.dedupeSettings(rows, branchId).map(toAppSettingResponse);
  }

  async getByKey(key: string): Promise<AppSettingResponse> {
    const row = await this.findSettingRow(key);
    if (!row) {
      throw new ApplicationException(
        ErrorCode.APP_SETTING_NOT_FOUND,
        `Setting not found: ${key}`,
        HttpStatus.NOT_FOUND,
        { settingKey: key },
      );
    }
    return toAppSettingResponse(row);
  }

  async createSetting(dto: CreateSettingDto): Promise<AppSettingResponse> {
    const { companyId } = getTenantScope(this.requestContext);
    const branchId = dto.branchId ?? null;

    if (dto.settingValue != null) {
      this.validateSettingValue(dto.dataType, dto.settingValue, dto.settingKey);
    }

    return this.unitOfWork.run(async (tx) => {
      if (branchId != null) {
        await assertBranchInCompany(tx, companyId, branchId);
      }

      await this.assertSettingKeyUnique(
        tx,
        companyId,
        branchId,
        dto.settingKey,
      );

      const now = BigInt(Date.now());
      const setting = await tx.appSetting.create({
        data: {
          uuid: randomUUID(),
          companyId,
          branchId,
          settingKey: dto.settingKey,
          settingName: dto.settingName,
          settingValue: dto.settingValue ?? null,
          dataType: dto.dataType,
          category: dto.category,
          defaultValue: dto.defaultValue ?? null,
          description: dto.description ?? null,
          isEditable: dto.isEditable ?? true,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        setting,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      this.invalidateCache(companyId, dto.settingKey);
      return toAppSettingResponse(setting);
    });
  }

  async getString(key: string, defaultValue?: string): Promise<string> {
    const row = await this.findSetting(key);
    if (row == null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ApplicationException(
        ErrorCode.NOT_FOUND,
        `Setting not found: ${key}`,
        HttpStatus.NOT_FOUND,
        { settingKey: key },
      );
    }
    if (row.settingValue == null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ApplicationException(
        ErrorCode.NOT_FOUND,
        `Setting not found: ${key}`,
        HttpStatus.NOT_FOUND,
        { settingKey: key },
      );
    }
    return row.settingValue;
  }

  async getNumber(key: string, defaultValue?: number): Promise<number> {
    const raw = await this.getString(key, defaultValue?.toString());
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Setting ${key} is not a valid number`,
        HttpStatus.BAD_REQUEST,
        { settingKey: key, value: raw },
      );
    }
    return parsed;
  }

  async getBoolean(key: string, defaultValue?: boolean): Promise<boolean> {
    const raw = await this.getString(
      key,
      defaultValue !== undefined ? String(defaultValue) : undefined,
    );
    const normalized = raw.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  async getJson<T>(key: string, defaultValue?: T): Promise<T> {
    const raw = await this.getString(
      key,
      defaultValue !== undefined ? JSON.stringify(defaultValue) : undefined,
    );
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Setting ${key} is not valid JSON`,
        HttpStatus.BAD_REQUEST,
        { settingKey: key },
      );
    }
  }

  async updateSetting(
    key: string,
    dto: UpdateSettingDto,
  ): Promise<AppSettingResponse> {
    const { companyId, branchId } = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const row = await this.findSettingInTx(tx, companyId, branchId, key);

      if (!row) {
        throw new ApplicationException(
          ErrorCode.APP_SETTING_NOT_FOUND,
          `Setting not found: ${key}`,
          HttpStatus.NOT_FOUND,
          { settingKey: key },
        );
      }

      this.assertEditable(row, key);
      this.validateSettingValue(row.dataType, dto.settingValue, key);

      const updateResult = await tx.appSetting.updateMany({
        where: {
          id: row.id,
          version: dto.version,
          deletedAt: null,
          isActive: true,
        },
        data: {
          settingValue: dto.settingValue,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        row.id,
        `Setting version conflict or not found: ${key}`,
      );

      const updated = await tx.appSetting.findFirstOrThrow({
        where: { id: row.id },
      });

      await auditAndLogChanges(
        tx,
        this.auditService,
        {
          entityType: OutboxEntityType.APP_SETTING,
          entityId: updated.id,
          entityUuid: updated.uuid,
          action: AuditAction.UPDATE,
          module: AuditModule.CONFIGURATION,
          description: `Updated setting ${key}`,
        },
        row as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
        APP_SETTING_AUDIT_FIELDS,
      );
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.APP_SETTING,
        entityUuid: updated.uuid,
        operation: OutboxOperation.UPDATE,
        payload: {
          uuid: updated.uuid,
          settingKey: updated.settingKey,
        },
      });

      this.invalidateCache(companyId, key);
      return toAppSettingResponse(updated);
    });
  }

  async deleteSetting(
    key: string,
    version: number,
  ): Promise<{ settingKey: string; deleted: true }> {
    const { companyId, branchId } = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const row = await this.findSettingInTx(tx, companyId, branchId, key);

      if (!row) {
        throw new ApplicationException(
          ErrorCode.APP_SETTING_NOT_FOUND,
          `Setting not found: ${key}`,
          HttpStatus.NOT_FOUND,
          { settingKey: key },
        );
      }

      this.assertEditable(row, key);

      const updateResult = await tx.appSetting.updateMany({
        where: {
          id: row.id,
          version,
          deletedAt: null,
        },
        data: {
          deletedAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        row.id,
        `Setting version conflict or not found: ${key}`,
      );

      await this.emitChange(
        tx,
        row,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      this.invalidateCache(companyId, key);
      return { settingKey: key, deleted: true };
    });
  }

  coerceValue(dataType: string, value: string | null): unknown {
    if (value == null || value === '') {
      return null;
    }

    switch (dataType) {
      case SettingDataType.INTEGER: {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
          return null;
        }
        return parsed;
      }
      case SettingDataType.DECIMAL:
      case 'NUMBER': {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
          return null;
        }
        return parsed;
      }
      case SettingDataType.BOOLEAN: {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
      }
      case SettingDataType.JSON:
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return null;
        }
      default:
        return value;
    }
  }

  private async emitChange(
    tx: TxClient,
    setting: AppSetting,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ): Promise<void> {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.APP_SETTING,
      entityId: setting.id,
      entityUuid: setting.uuid,
      action,
      module: AuditModule.CONFIGURATION,
      description: `${action} setting ${setting.settingKey}`,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.APP_SETTING,
      entityUuid: setting.uuid,
      operation,
      payload: {
        uuid: setting.uuid,
        settingKey: setting.settingKey,
      },
    });
  }

  private async assertSettingKeyUnique(
    tx: TxClient,
    companyId: bigint,
    branchId: bigint | null,
    settingKey: string,
  ): Promise<void> {
    const existing = await tx.appSetting.findFirst({
      where: {
        companyId,
        branchId,
        settingKey,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ApplicationException(
        ErrorCode.APP_SETTING_CONFLICT,
        `Setting already exists: ${settingKey}`,
        HttpStatus.CONFLICT,
        { settingKey },
      );
    }
  }

  private assertEditable(row: AppSetting, key: string): void {
    if (!row.isEditable) {
      throw new ApplicationException(
        ErrorCode.APP_SETTING_NOT_EDITABLE,
        `Setting ${key} is not editable`,
        HttpStatus.FORBIDDEN,
        { settingKey: key },
      );
    }
  }

  private dedupeSettings(rows: AppSetting[], branchId: bigint): AppSetting[] {
    const byKey = new Map<string, AppSetting>();

    for (const row of rows) {
      const existing = byKey.get(row.settingKey);
      if (!existing) {
        byKey.set(row.settingKey, row);
        continue;
      }
      if (row.branchId === branchId) {
        byKey.set(row.settingKey, row);
      }
    }

    return Array.from(byKey.values()).sort((left, right) => {
      const categoryCompare = left.category.localeCompare(right.category);
      if (categoryCompare !== 0) {
        return categoryCompare;
      }
      return left.settingKey.localeCompare(right.settingKey);
    });
  }

  private validateSettingValue(
    dataType: string,
    settingValue: string,
    settingKey: string,
  ): void {
    switch (dataType) {
      case SettingDataType.BOOLEAN:
        if (!this.isValidBooleanValue(settingValue)) {
          this.throwInvalidSettingValue(settingKey, dataType, settingValue);
        }
        return;
      case SettingDataType.INTEGER: {
        const parsed = Number.parseInt(settingValue, 10);
        if (Number.isNaN(parsed) || parsed.toString() !== settingValue.trim()) {
          this.throwInvalidSettingValue(settingKey, dataType, settingValue);
        }
        return;
      }
      case SettingDataType.DECIMAL:
      case 'NUMBER':
        if (Number.isNaN(Number(settingValue))) {
          this.throwInvalidSettingValue(settingKey, dataType, settingValue);
        }
        return;
      case SettingDataType.JSON:
        try {
          JSON.parse(settingValue);
        } catch {
          this.throwInvalidSettingValue(settingKey, dataType, settingValue);
        }
        return;
      case SettingDataType.STRING:
        return;
      default:
        this.throwInvalidSettingValue(settingKey, dataType, settingValue);
    }
  }

  private isValidBooleanValue(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' ||
      normalized === 'false' ||
      normalized === '1' ||
      normalized === '0'
    );
  }

  private throwInvalidSettingValue(
    settingKey: string,
    dataType: string,
    value: string,
  ): never {
    throw new ApplicationException(
      ErrorCode.VALIDATION_ERROR,
      `Setting ${settingKey} value is not valid for data type ${dataType}`,
      HttpStatus.BAD_REQUEST,
      { settingKey, dataType, value },
    );
  }

  private async findSettingRow(key: string): Promise<AppSetting | null> {
    const { companyId, branchId } = getTenantScope(this.requestContext);

    const branchScoped = await this.prisma.client.appSetting.findFirst({
      where: {
        companyId,
        branchId,
        settingKey: key,
        isActive: true,
        deletedAt: null,
      },
    });

    if (branchScoped) {
      return branchScoped;
    }

    return this.prisma.client.appSetting.findFirst({
      where: {
        companyId,
        branchId: null,
        settingKey: key,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  private async findSettingInTx(
    tx: TxClient,
    companyId: bigint,
    branchId: bigint,
    key: string,
  ): Promise<AppSetting | null> {
    const branchScoped = await tx.appSetting.findFirst({
      where: {
        companyId,
        branchId,
        settingKey: key,
        isActive: true,
        deletedAt: null,
      },
    });

    if (branchScoped) {
      return branchScoped;
    }

    return tx.appSetting.findFirst({
      where: {
        companyId,
        branchId: null,
        settingKey: key,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  private async findSetting(key: string) {
    const { companyId, branchId } = getTenantScope(this.requestContext);
    const cacheKey = this.cacheKey(companyId, branchId, key);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.row;
    }

    const branchScoped = await this.prisma.client.appSetting.findFirst({
      where: {
        companyId,
        branchId,
        settingKey: key,
        isActive: true,
        deletedAt: null,
      },
    });

    if (branchScoped) {
      this.putCache(cacheKey, branchScoped);
      return branchScoped;
    }

    const companyScoped = await this.prisma.client.appSetting.findFirst({
      where: {
        companyId,
        branchId: null,
        settingKey: key,
        isActive: true,
        deletedAt: null,
      },
    });

    if (companyScoped) {
      this.putCache(cacheKey, companyScoped);
    }

    return companyScoped;
  }

  private invalidateCache(companyId: bigint, key: string): void {
    const prefix = `${companyId}:`;
    const suffix = `:${key}`;

    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(prefix) && cacheKey.endsWith(suffix)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  private cacheKey(companyId: bigint, branchId: bigint, key: string): string {
    return `${companyId}:${branchId}:${key}`;
  }

  private putCache(
    cacheKey: string,
    row: {
      id: bigint;
      settingValue: string | null;
      dataType: string;
      isEditable: boolean;
    },
  ): void {
    this.cache.set(cacheKey, {
      row,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }
}
