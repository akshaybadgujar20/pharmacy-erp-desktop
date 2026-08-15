import { HttpStatus } from '@nestjs/common';

export class ApplicationException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = HttpStatus.BAD_REQUEST,
    public readonly details: unknown = null,
  ) {
    super(message);

    this.name = 'ApplicationException';

    Object.setPrototypeOf(this, ApplicationException.prototype);
  }
}
