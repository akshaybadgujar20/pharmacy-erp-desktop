import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { ApplicationException } from './application.exception';
import { ErrorCode } from './error-code';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // -----------------------------------------
    // 1. Business/Application Exception
    // -----------------------------------------

    if (exception instanceof ApplicationException) {
      response.status(exception.statusCode).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      });

      return;
    }

    // -----------------------------------------
    // 2. Standard NestJS HTTP Exception
    // -----------------------------------------

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      let message = 'Request failed';
      let details: unknown = null;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const errorResponse = exceptionResponse as Record<string, unknown>;

        if (Array.isArray(errorResponse['message'])) {
          message = 'Validation failed';
          details = errorResponse['message'];
        } else if (typeof errorResponse['message'] === 'string') {
          message = errorResponse['message'];
        }
      }

      response.status(status).json({
        success: false,
        error: {
          code: this.getErrorCode(status),
          message,
          details,
        },
      });

      return;
    }

    // -----------------------------------------
    // 3. Unknown / Unexpected Exception
    // -----------------------------------------

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        details: null,
      },
    });
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;

      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;

      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;

      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;

      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;

      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
