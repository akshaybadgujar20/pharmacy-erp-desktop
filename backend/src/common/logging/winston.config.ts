import * as os from 'os';
import * as path from 'path';
import type { ConfigService } from '@nestjs/config';
import type { WinstonModuleOptions } from 'nest-winston';
import { utilities as nestWinstonUtilities } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { redactSensitiveFields, safeSerializeValue } from './log-sanitizer';

function defaultLogDir(): string {
  const base = process.env.LOCALAPPDATA ?? process.env.APPDATA ?? os.homedir();
  return path.join(base, 'pharmacy-erp', 'logs');
}

function safeSerializer(): winston.Logform.Format {
  return winston.format((info) => {
    const serialized = safeSerializeValue(
      info,
    ) as winston.Logform.TransformableInfo;
    return redactSensitiveFields(serialized);
  })();
}

function jsonFileFormat(): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    safeSerializer(),
    winston.format.json(),
  );
}

function consoleFormat(isDev: boolean): winston.Logform.Format {
  if (isDev) {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      safeSerializer(),
      nestWinstonUtilities.format.nestLike('PharmacyERP', {
        colors: true,
        prettyPrint: true,
      }),
    );
  }

  return jsonFileFormat();
}

export function buildWinstonModuleOptions(
  configService: ConfigService,
): WinstonModuleOptions {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isDev = nodeEnv !== 'production';
  const level =
    configService.get<string>('LOG_LEVEL') ?? (isDev ? 'debug' : 'info');
  const logDir = configService.get<string>('LOG_DIR') ?? defaultLogDir();

  const appRotate = new DailyRotateFile({
    dirname: logDir,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: jsonFileFormat(),
  });

  const errorRotate = new DailyRotateFile({
    dirname: logDir,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: jsonFileFormat(),
  });

  return {
    level,
    transports: [
      new winston.transports.Console({
        format: consoleFormat(isDev),
      }),
      appRotate,
      errorRotate,
    ],
  };
}
