import { ConfigService } from '@nestjs/config';

const DEV_JWT_SECRET = 'pharmacy-erp-dev-secret-change-in-production';

export function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

  if (!secret && nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return secret ?? DEV_JWT_SECRET;
}
