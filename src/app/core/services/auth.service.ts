import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { DeviceService } from './device.service';
import { TokenStorageService } from './token-storage.service';
import type {
  AuthTokenResponse,
  AuthUser,
  LoginRequest,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<AuthUser | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  async login(credentials: LoginRequest): Promise<AuthTokenResponse> {
    const deviceInfo = await this.deviceService.getDeviceInfo();
    const response = await firstValueFrom(
      this.api.post<AuthTokenResponse>('/auth/login', {
        ...credentials,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        operatingSystem: deviceInfo.operatingSystem,
        applicationVersion: deviceInfo.applicationVersion,
      }),
    );

    await this.persistSession(response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.post('/auth/logout'));
    } finally {
      await this.clearSession();
      await this.router.navigate(['/login']);
    }
  }

  async refreshSession(): Promise<void> {
    const refreshToken = await this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await this.clearSession();
      return;
    }

    const response = await firstValueFrom(
      this.api.post<AuthTokenResponse>('/auth/refresh', { refreshToken }),
    );

    if (response) {
      await this.persistSession(response);
    }
  }

  async loadCurrentUser(): Promise<AuthUser | null> {
    const token = await this.tokenStorage.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const user = await firstValueFrom(this.api.get<AuthUser>('/auth/me'));
      if (user) {
        this.currentUserSignal.set(user);
      }
      return user ?? null;
    } catch {
      await this.clearSession();
      return null;
    }
  }

  async clearSession(): Promise<void> {
    this.currentUserSignal.set(null);
    await this.tokenStorage.clear();
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSignal();
    return user?.permissions.includes(permission) ?? false;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return user?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  private async persistSession(response: AuthTokenResponse): Promise<void> {
    await this.tokenStorage.setAccessToken(response.accessToken);
    await this.tokenStorage.setRefreshToken(response.refreshToken);
    this.currentUserSignal.set(response.user);
  }
}
