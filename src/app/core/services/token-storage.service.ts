import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment';

const ACCESS_TOKEN_KEY = 'pharmacy_erp_access_token';
const REFRESH_TOKEN_KEY = 'pharmacy_erp_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private memoryStore = new Map<string, string>();

  async getAccessToken(): Promise<string | null> {
    return this.get(ACCESS_TOKEN_KEY);
  }

  async setAccessToken(token: string): Promise<void> {
    await this.set(ACCESS_TOKEN_KEY, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return this.get(REFRESH_TOKEN_KEY);
  }

  async setRefreshToken(token: string): Promise<void> {
    await this.set(REFRESH_TOKEN_KEY, token);
  }

  async clear(): Promise<void> {
    await this.delete(ACCESS_TOKEN_KEY);
    await this.delete(REFRESH_TOKEN_KEY);
  }

  private async get(key: string): Promise<string | null> {
    if (window.electronAPI?.secureStore) {
      return window.electronAPI.secureStore.get(key);
    }

    if (!environment.production) {
      return sessionStorage.getItem(key);
    }

    return this.memoryStore.get(key) ?? null;
  }

  private async set(key: string, value: string): Promise<void> {
    if (window.electronAPI?.secureStore) {
      await window.electronAPI.secureStore.set(key, value);
      return;
    }

    if (!environment.production) {
      sessionStorage.setItem(key, value);
      return;
    }

    this.memoryStore.set(key, value);
  }

  private async delete(key: string): Promise<void> {
    if (window.electronAPI?.secureStore) {
      await window.electronAPI.secureStore.delete(key);
      return;
    }

    if (!environment.production) {
      sessionStorage.removeItem(key);
      return;
    }

    this.memoryStore.delete(key);
  }
}
