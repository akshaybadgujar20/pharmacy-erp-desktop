import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { RequestContextService } from '../../persistence/context/request-context.service';
import { mapPrismaError } from '../../persistence/prisma/prisma-error.mapper';
import { serializeForJson } from '../serialization/serialize-for-json';
import { ApplicationException } from './application.exception';
import { ErrorCode } from './error-code';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly requestContext: RequestContextService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const mappedPrisma = mapPrismaError(exception);
    if (mappedPrisma) {
      this.handleApplicationException(mappedPrisma, response);
      return;
    }

    if (exception instanceof ApplicationException) {
      this.handleApplicationException(exception, response);
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
          details: serializeForJson(details),
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

  private handleApplicationException(
    exception: ApplicationException,
    response: Response,
  ): void {
    const statusCode = Number(exception.statusCode);
    if (
      statusCode >= Number(HttpStatus.BAD_REQUEST) &&
      statusCode < Number(HttpStatus.INTERNAL_SERVER_ERROR)
    ) {
      const ctx = this.requestContext.tryGet();
      this.logger.warn({
        message: exception.message,
        code: exception.code,
        statusCode: exception.statusCode,
        correlationId: ctx?.correlationId,
        details: serializeForJson(exception.details),
      });
    }

    response.status(exception.statusCode).json({
      success: false,
      error: {
        code: exception.code,
        message: exception.message,
        details: serializeForJson(exception.details),
      },
    });
  }

  private getErrorCode(status: number): string {
    if (status === Number(HttpStatus.BAD_REQUEST)) {
      return ErrorCode.BAD_REQUEST;
    }
    if (status === Number(HttpStatus.UNAUTHORIZED)) {
      return ErrorCode.UNAUTHORIZED;
    }
    if (status === Number(HttpStatus.FORBIDDEN)) {
      return ErrorCode.FORBIDDEN;
    }
    if (status === Number(HttpStatus.NOT_FOUND)) {
      return ErrorCode.NOT_FOUND;
    }
    if (status === Number(HttpStatus.CONFLICT)) {
      return ErrorCode.CONFLICT;
    }
    if (status === Number(HttpStatus.UNPROCESSABLE_ENTITY)) {
      return ErrorCode.VALIDATION_ERROR;
    }
    return ErrorCode.INTERNAL_SERVER_ERROR;
  }
}
