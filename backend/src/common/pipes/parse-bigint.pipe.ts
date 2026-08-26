import { HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { ApplicationException } from '../exceptions/application.exception';
import { ErrorCode } from '../exceptions/error-code';

@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    if (value.length > 20) {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid numeric id: value too long`,
        HttpStatus.BAD_REQUEST,
        { value },
      );
    }

    if (!/^\d+$/.test(value)) {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid numeric id: ${value}`,
        HttpStatus.BAD_REQUEST,
        { value },
      );
    }

    return BigInt(value);
  }
}
