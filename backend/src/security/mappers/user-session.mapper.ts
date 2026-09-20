import { UserSession } from '@prisma/client';
import { serializeBigInt } from '../utils/security.util';

export interface UserSessionResponse {
  id: string;
  uuid: string;
  userId: string;
  companyId: string;
  branchId: string;
  deviceName: string | null;
  deviceType: string | null;
  operatingSystem: string | null;
  applicationVersion: string | null;
  ipAddress: string | null;
  loginTime: string;
  lastActivityAt: string;
  logoutTime: string | null;
  expiresAt: string;
  isActive: boolean;
  logoutReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: string;
}

export function toUserSessionResponse(
  session: UserSession,
): UserSessionResponse {
  return {
    id: session.id.toString(),
    uuid: session.uuid,
    userId: session.userId.toString(),
    companyId: session.companyId.toString(),
    branchId: session.branchId.toString(),
    deviceName: session.deviceName,
    deviceType: session.deviceType,
    operatingSystem: session.operatingSystem,
    applicationVersion: session.applicationVersion,
    ipAddress: session.ipAddress,
    loginTime: session.loginTime.toString(),
    lastActivityAt: session.lastActivityAt.toString(),
    logoutTime: serializeBigInt(session.logoutTime),
    expiresAt: session.expiresAt.toString(),
    isActive: session.isActive,
    logoutReason: session.logoutReason,
    createdAt: session.createdAt.toString(),
    updatedAt: session.updatedAt.toString(),
    deletedAt: serializeBigInt(session.deletedAt),
    version: session.version.toString(),
  };
}
