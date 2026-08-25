export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  POST: 'POST',
  SYNC: 'SYNC',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
