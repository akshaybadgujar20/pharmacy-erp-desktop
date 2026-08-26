import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { RequestContextService } from '../../persistence/context/request-context.service';
import { ApplicationException } from './application.exception';
import { ErrorCode } from './error-code';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let requestContext: RequestContextService;

  beforeEach(() => {
    requestContext = {
      tryGet: jest.fn().mockReturnValue({ correlationId: 'corr-1' }),
    } as unknown as RequestContextService;
    filter = new GlobalExceptionFilter(requestContext);
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });

  it('handles ApplicationException', () => {
    const exception = new ApplicationException(
      ErrorCode.NOT_FOUND,
      'Not found',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost);

    expect(loggerWarnSpy).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
        details: null,
      },
    });
  });

  it('serializes bigint in ApplicationException details', () => {
    const exception = new ApplicationException(
      ErrorCode.NOT_FOUND,
      'Not found',
      HttpStatus.NOT_FOUND,
      { partyId: 42n },
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
        details: { partyId: '42' },
      },
    });
  });

  it('handles HttpException with string response', () => {
    const exception = new HttpException('Bad input', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: 'Bad input',
        details: null,
      },
    });
  });

  it('handles HttpException with validation array', () => {
    const exception = new HttpException(
      { message: ['field is required', 'field must be string'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: 'Validation failed',
        details: ['field is required', 'field must be string'],
      },
    });
  });

  it('handles unknown exception with 500 and logs', () => {
    const exception = new Error('Something broke');

    filter.catch(exception, mockHost);

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Unhandled exception',
      exception.stack,
    );
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        details: null,
      },
    });
  });
});
