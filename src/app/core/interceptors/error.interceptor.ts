import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiClientError } from '../models/api-response.types';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const apiError = error.error as {
          success?: boolean;
          error?: { code?: string; message?: string; details?: unknown };
        };

        if (apiError?.success === false && apiError.error) {
          const clientError = new ApiClientError(
            apiError.error.code ?? 'UNKNOWN_ERROR',
            apiError.error.message ?? 'An error occurred',
            apiError.error.details,
          );

          if (
            clientError.code === 'UNAUTHORIZED' ||
            clientError.code === 'AUTH_SESSION_EXPIRED'
          ) {
            authService.clearSession();
            router.navigate(['/login']);
          } else {
            //TODO: add error handler
          }

          return throwError(() => clientError);
        }

        //TODO: add error handler
        return throwError(() => error);
      }

      if (error instanceof ApiClientError) {
        //TODO: add error handler
      }

      return throwError(() => error);
    }),
  );
};
