import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { RequestContextService } from '../persistence/context/request-context.service';
import { PrismaService } from '../prisma.service';
import { SettingDataType } from './setting-keys.constants';

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
  ) {}

  async listByCategory(category?: string) {
    const { companyId, branchId } = this.requestContext.get();

    return this.prisma.client.appSetting.findMany({
      where: {
        companyId,
        OR: [{ branchId }, { branchId: null }],
        isActive: true,
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      orderBy: [{ category: 'asc' }, { settingKey: 'asc' }],
    });
  }

  async getString(key: string, defaultValue?: string): Promise<string> {
    const row = await this.findSetting(key);
    if (!row?.settingValue) {
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
    return raw === 'true' || raw === '1';
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

  async updateSetting(key: string, settingValue: string) {
    const { companyId, branchId } = this.requestContext.get();
    const row = await this.findSetting(key);

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

    const updated = await this.prisma.client.appSetting.update({
      where: { id: row.id },
      data: { settingValue },
    });

    this.cache.delete(this.cacheKey(companyId, branchId, key));
    return updated;
  }

  private async findSetting(key: string) {
    const { companyId, branchId } = this.requestContext.get();
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

  coerceValue(dataType: string, value: string | null): unknown {
    if (!value) {
      return null;
    }

    switch (dataType) {
      case SettingDataType.NUMBER:
        return Number(value);
      case SettingDataType.BOOLEAN:
        return value === 'true' || value === '1';
      case SettingDataType.JSON:
        return JSON.parse(value) as unknown;
      default:
        return value;
    }
  }
}
