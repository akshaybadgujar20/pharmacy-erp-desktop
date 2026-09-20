export interface AppSetting {
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
  version: string;
}

export interface UpdateSettingRequest {
  version: string;
  settingValue: string;
}
