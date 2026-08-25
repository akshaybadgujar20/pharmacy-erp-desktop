import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { DeviceService } from '../services/device.service';
import { TokenStorageService } from '../services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const deviceService = inject(DeviceService);

  return from(
    Promise.all([tokenStorage.getAccessToken(), deviceService.getDeviceId()]),
  ).pipe(
    switchMap(([token, deviceId]) => {
      let headers = req.headers.set('x-device-id', deviceId);

      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }

      return next(req.clone({ headers }));
    }),
  );
};
