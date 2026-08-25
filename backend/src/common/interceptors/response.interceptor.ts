import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isPaginatedResult } from '../response/paginated-result';
import { ApiSuccessResponse } from '../response/api-response.types';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponse<unknown> | StreamableFile
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<unknown> | StreamableFile> {
    return next.handle().pipe(
      map((result) => {
        if (result instanceof StreamableFile) {
          return result;
        }

        if (isPaginatedResult(result)) {
          return {
            success: true,
            data: result.data,
            pagination: result.pagination,
          };
        }

        return {
          success: true,
          data: result,
        };
      }),
    );
  }
}
