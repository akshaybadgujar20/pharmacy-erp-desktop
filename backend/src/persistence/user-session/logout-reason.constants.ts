export const LogoutReason = {
  USER_LOGOUT: 'USER_LOGOUT',
  TIMEOUT: 'TIMEOUT',
  FORCE_LOGOUT: 'FORCE_LOGOUT',
  SYSTEM_RESTART: 'SYSTEM_RESTART',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
} as const;

export type LogoutReason =
  (typeof LogoutReason)[keyof typeof LogoutReason];
