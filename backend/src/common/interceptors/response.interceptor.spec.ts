import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { PaginatedResult } from '../response/paginated-result';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps plain data in success envelope', async () => {
    const next: CallHandler = {
      handle: () => of({ id: 1, name: 'Test' }),
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, next),
    );

    expect(result).toEqual({
      success: true,
      data: { id: 1, name: 'Test' },
    });
  });

  it('unwraps PaginatedResult with pagination', async () => {
    const pagination = { page: 1, pageSize: 10, total: 2, totalPages: 1 };
    const paginated = PaginatedResult.of([{ id: 1 }, { id: 2 }], pagination);

    const next: CallHandler = {
      handle: () => of(paginated),
    };

    const result = await lastValueFrom(
      interceptor.intercept(mockContext, next),
    );

    expect(result).toEqual({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      pagination,
    });
  });
});
