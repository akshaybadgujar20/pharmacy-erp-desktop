import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';

export function throwNotFound(
  code: string,
  message: string,
  details?: Record<string, string>,
): never {
  throw new ApplicationException(code, message, HttpStatus.NOT_FOUND, details);
}
