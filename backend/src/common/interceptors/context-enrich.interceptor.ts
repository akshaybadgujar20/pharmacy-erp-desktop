import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { RequestContextService } from '../../persistence/context/request-context.service';

@Injectable()
export class ContextEnrichInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (user) {
      const ctx = this.requestContext.tryGet();
      if (ctx) {
        const enriched = {
          ...ctx,
          userId: user.userId,
          companyId: user.companyId,
          branchId: user.branchId,
          sessionId: user.sessionUuid,
        };
        return new Observable((subscriber) => {
          void this.requestContext.run(enriched, () => {
            next.handle().subscribe(subscriber);
          });
        });
      }
    }

    return next.handle();
  }
}
