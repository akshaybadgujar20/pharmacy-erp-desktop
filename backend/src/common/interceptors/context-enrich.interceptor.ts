import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { RequestContextService } from '../../persistence/context/request-context.service';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class ContextEnrichInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;

    if (user) {
      const ctx = this.requestContext.tryGet();
      if (ctx) {
        ctx.userId = user.userId;
        ctx.companyId = user.companyId;
        ctx.branchId = user.branchId;
        ctx.sessionId = user.sessionUuid;
      }
    }

    return next.handle();
  }
}
