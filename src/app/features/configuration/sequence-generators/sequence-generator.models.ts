export interface SequenceGenerator {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  documentType: string;
  prefix: string | null;
  suffix: string | null;
  currentNumber: string;
  incrementBy: number;
  paddingLength: number;
  resetPolicy: string;
  format: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateSequenceGeneratorRequest {
  branchId?: string;
  documentType: string;
  prefix?: string;
  suffix?: string;
  currentNumber: string;
  incrementBy?: number;
  paddingLength?: number;
  resetPolicy: string;
  format?: string;
  isActive?: boolean;
}

export interface UpdateSequenceGeneratorRequest {
  version: number;
  branchId?: string;
  documentType?: string;
  prefix?: string;
  suffix?: string;
  currentNumber?: string;
  incrementBy?: number;
  paddingLength?: number;
  resetPolicy?: string;
  format?: string;
  isActive?: boolean;
}
