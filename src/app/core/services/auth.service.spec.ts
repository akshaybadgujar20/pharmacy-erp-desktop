import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthTokenResponse } from '../models/auth.models';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { DeviceService } from './device.service';
import { TokenStorageService } from './token-storage.service';

describe('AuthService', () => {
  let authService: AuthService;
  let apiService: jest.Mocked<Pick<ApiService, 'post' | 'get'>>;
  let tokenStorage: jest.Mocked<
    Pick<
      TokenStorageService,
      'setAccessToken' | 'setRefreshToken' | 'getAccessToken' | 'getRefreshToken' | 'clear'
    >
  >;
  let router: jest.Mocked<Pick<Router, 'navigate'>>;

  const tokenResponse: AuthTokenResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: '15m',
    user: {
      id: '1',
      username: 'admin',
      roles: ['ADMIN'],
      permissions: ['SALES:SALES_INVOICE:READ'],
      companyId: '1',
      branchId: '1',
    },
  };

  beforeEach(() => {
    apiService = {
      post: jest.fn(),
      get: jest.fn(),
    };
    tokenStorage = {
      setAccessToken: jest.fn().mockResolvedValue(undefined),
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
      getAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiService },
        { provide: TokenStorageService, useValue: tokenStorage },
        {
          provide: DeviceService,
          useValue: {
            getDeviceInfo: async () => ({
              deviceId: 'desktop-dev-001',
              deviceType: 'DESKTOP',
            }),
          },
        },
        { provide: Router, useValue: router },
      ],
    });

    authService = TestBed.inject(AuthService);
  });

  it('persists session on login', async () => {
    apiService.post.mockReturnValue(of(tokenResponse));

    const result = await authService.login({
      username: 'admin',
      password: 'admin123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('access-token');
    expect(authService.currentUser()?.username).toBe('admin');
  });

  it('clears session on logout', async () => {
    apiService.post.mockReturnValue(of({ message: 'ok' }));

    await authService.logout();

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
