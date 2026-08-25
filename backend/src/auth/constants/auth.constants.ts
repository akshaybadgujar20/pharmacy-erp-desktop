export const AUTH_CONSTANTS = {
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  JWT_SECRET:
    process.env.JWT_SECRET ?? 'pharmacy-erp-dev-secret-change-in-production',
} as const;
