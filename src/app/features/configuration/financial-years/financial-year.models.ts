export interface FinancialYear {
  id: string;
  uuid: string;
  companyId: string;
  branchId: string | null;
  financialYearCode: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  closingDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface CreateFinancialYearRequest {
  financialYearCode: string;
  financialYearName: string;
  startDate: string;
  endDate: string;
  branchId?: string;
  isCurrent?: boolean;
  remarks?: string;
}

export interface UpdateFinancialYearRequest {
  version: number;
  financialYearCode?: string;
  financialYearName?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  isCurrent?: boolean;
  remarks?: string;
}
