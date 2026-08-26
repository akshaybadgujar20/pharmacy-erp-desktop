import { HttpStatus, Injectable } from '@nestjs/common';
import { AppSetting } from '@prisma/client';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { RequestContextService } from '../persistence/context/request-context.service';
import { getTenantScope } from '../persistence/context/tenant-scope.util';
import type { TxClient } from '../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { SettingDataType } from './setting-keys.constants';
import { AppSettingResponse, toAppSettingResponse } from './settings.mapper';

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
  ) {}

  async listByCategory(category?: string): Promise<AppSettingResponse[]> {
    const { companyId, branchId } = getTenantScope(this.requestContext);

    const rows = await this.prisma.client.appSetting.findMany({
      where: {
        companyId,
        OR: [{ branchId }, { branchId: null }],
        isActive: true,
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { settingKey: 'asc' }],
    });

    return this.dedupeSettings(rows, branchId).map(toAppSettingResponse);
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
    settingValue: string,
  ): Promise<AppSettingResponse> {
    const { companyId, branchId } = getTenantScope(this.requestContext);

    return this.unitOfWork.run(async (tx) => {
      const row = await this.findSettingInTx(tx, companyId, branchId, key);

      if (!row) {
        throw new ApplicationException(
          ErrorCode.NOT_FOUND,
          `Setting not found: ${key}`,
          HttpStatus.NOT_FOUND,
          { settingKey: key },
        );
      }

      if (!row.isEditable) {
        throw new ApplicationException(
          ErrorCode.FORBIDDEN,
          `Setting ${key} is not editable`,
          HttpStatus.FORBIDDEN,
          { settingKey: key },
        );
      }

      this.validateSettingValue(row.dataType, settingValue, key);

      const updateResult = await tx.appSetting.updateMany({
        where: {
          id: row.id,
          version: row.version,
          deletedAt: null,
          isActive: true,
        },
        data: {
          settingValue,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new ApplicationException(
          ErrorCode.ENTITY_VERSION_CONFLICT,
          `Setting version conflict or not found: ${key}`,
          HttpStatus.CONFLICT,
          { id: row.id.toString() },
        );
      }

      const updated = await tx.appSetting.findFirstOrThrow({
        where: { id: row.id },
      });

      await this.auditService.log(tx, {
        entityType: 'AppSetting',
        entityId: updated.id,
        entityUuid: updated.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.CONFIGURATION,
        description: `Updated setting ${key}`,
      });

      this.invalidateCache(companyId, key);
      return toAppSettingResponse(updated);
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
