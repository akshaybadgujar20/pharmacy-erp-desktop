export interface RequestContextData {
  companyId?: bigint;
  branchId?: bigint;
  userId?: bigint;
  deviceId: string;
  correlationId?: string;
  ipAddress?: string;
  sessionId?: string;
}
