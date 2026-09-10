import { AppSetting } from '@prisma/client';
import { serializeEpochMs } from './utils/settings.util';

export interface AppSettingResponse {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  settingKey: string;
  settingName: string;
  settingValue: string | null;
  dataType: string;
  category: string;
  defaultValue: string | null;
  description: string | null;
  isEditable: boolean;
  isEncrypted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export function toAppSettingResponse(setting: AppSetting): AppSettingResponse {
  return {
    id: setting.id.toString(),
    uuid: setting.uuid,
    companyId: setting.companyId.toString(),
    branchId: setting.branchId?.toString() ?? null,
    settingKey: setting.settingKey,
    settingName: setting.settingName,
    settingValue: setting.settingValue,
    dataType: setting.dataType,
    category: setting.category,
    defaultValue: setting.defaultValue,
    description: setting.description,
    isEditable: setting.isEditable,
    isEncrypted: setting.isEncrypted,
    isActive: setting.isActive,
    createdAt: serializeEpochMs(setting.createdAt) ?? '',
    updatedAt: serializeEpochMs(setting.updatedAt) ?? '',
    version: setting.version,
  };
}
