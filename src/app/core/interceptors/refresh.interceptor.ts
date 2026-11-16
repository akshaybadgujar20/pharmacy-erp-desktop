import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { ApiClientError } from '../models/api-response.types';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
const REFRESH_RETRY_HEADER = 'X-Auth-Refresh-Retry';

const SESSION_REFRESH_CODES = new Set(['AUTH_SESSION_EXPIRED', 'UNAUTHORIZED']);

function isSkippableUrl(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/change-required')
  );
}

function extractErrorCode(error: HttpErrorResponse): string | undefined {
  const body = error.error as {
    error?: { code?: string };
  };
  return body?.error?.code;
}

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenStorage = inject(TokenStorageService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (req.headers.has(REFRESH_RETRY_HEADER) || isSkippableUrl(req.url)) {
        return throwError(() => error);
      }

      const code = extractErrorCode(error);
      if (code && !SESSION_REFRESH_CODES.has(code)) {
        return throwError(() => error);
      }

      return from(
        (async () => {
          const hadRefresh = await tokenStorage.getRefreshToken();
          if (!hadRefresh) {
            throw error;
          }
          await authService.refreshSession();
          const accessToken = await tokenStorage.getAccessToken();
          if (!accessToken) {
            throw error;
          }
          return accessToken;
        })(),
      ).pipe(
        switchMap((accessToken) => {
          const retry = req.clone({
            setHeaders: {
              Authorization: `Bearer ${accessToken}`,
              [REFRESH_RETRY_HEADER]: '1',
            },
          });
          return next(retry);
        }),
        catchError((retryError) => {
          if (retryError instanceof ApiClientError) {
            return throwError(() => retryError);
          }
          return throwError(() => error);
        }),
      );
    }),
  );
};