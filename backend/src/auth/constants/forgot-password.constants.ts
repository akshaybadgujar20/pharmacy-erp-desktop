export const FORGOT_PASSWORD_CONSTANTS = {
  OTP_LENGTH: 6,
  OTP_TTL_MS: 10 * 60 * 1000,
  MAX_VERIFY_ATTEMPTS: 5,
  MIN_REQUEST_INTERVAL_MS: 60 * 1000,
  GENERIC_SUCCESS_MESSAGE:
    'If an account exists for that username, a verification code has been sent to the registered email.',
} as const;
