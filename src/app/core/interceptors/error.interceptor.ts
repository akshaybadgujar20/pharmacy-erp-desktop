import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { ApiClientError } from '../models/api-response.types';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
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
            toastr.error(clientError.message, 'Error');
          }

          return throwError(() => clientError);
        }

        toastr.error(error.message || 'Network error', 'Error');
        return throwError(() => error);
      }

      if (error instanceof ApiClientError) {
        toastr.error(error.message, 'Error');
      }

      return throwError(() => error);
    }),
  );
};
