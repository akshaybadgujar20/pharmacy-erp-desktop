import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiClientError } from '../../../core/models/api-response.types';
import { DEFAULT_TOAST_HOST_KEY } from './adapter/toast-defaults';
import { toPrimeMessage } from './adapter/toast-message.adapter';
import { ToastMessageConfig, ToastMessageOverrides } from './types/toast-message.types';
import { ToastPromiseConfig } from './types/toast-promise.types';

const AUTH_SKIP_CODES = new Set(['UNAUTHORIZED', 'AUTH_SESSION_EXPIRED']);
const DEFAULT_LOADING_ICON = 'pi pi-spinner pi-spin';
const DEFAULT_TRANSITION_DELAY_MS = 300;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageService = inject(MessageService);

  show(config: ToastMessageConfig): void {
    this.messageService.add(toPrimeMessage(config));
  }

  success(
    summary: string,
    detail?: string,
    overrides?: ToastMessageOverrides,
  ): void {
    this.show({ severity: 'success', summary, detail, ...overrides });
  }

  info(
    summary: string,
    detail?: string,
    overrides?: ToastMessageOverrides,
  ): void {
    this.show({ severity: 'info', summary, detail, ...overrides });
  }

  warn(
    summary: string,
    detail?: string,
    overrides?: ToastMessageOverrides,
  ): void {
    this.show({ severity: 'warn', summary, detail, ...overrides });
  }

  error(
    summary: string,
    detail?: string,
    overrides?: ToastMessageOverrides,
  ): void {
    this.show({ severity: 'error', summary, detail, ...overrides });
  }

  clear(key?: string): void {
    if (key) {
      this.messageService.clear(key);
      return;
    }
    this.messageService.clear();
  }

  showApiError(error: unknown): void {
    if (error instanceof ApiClientError) {
      if (AUTH_SKIP_CODES.has(error.code)) {
        return;
      }
      this.error(error.message, error.code);
      return;
    }

    if (error instanceof HttpErrorResponse) {
      this.error(
        error.statusText || 'Something went wrong',
        `HTTP ${error.status}`,
      );
      return;
    }

    if (error instanceof Error) {
      this.error(error.message);
      return;
    }

    this.error('Something went wrong');
  }

  async runWithLoadingToast<T>(config: ToastPromiseConfig<T>): Promise<T> {
    const key = config.key ?? DEFAULT_TOAST_HOST_KEY;
    const transitionDelayMs =
      config.transitionDelayMs ?? DEFAULT_TRANSITION_DELAY_MS;

    this.show({
      severity: 'secondary',
      summary: 'Please wait...',
      detail: 'Your request is being processed.',
      icon: DEFAULT_LOADING_ICON,
      key,
      sticky: true,
      ...config.loading,
    });

    try {
      const result = await config.task();
      this.clear(key);
      await this.delay(transitionDelayMs);
      this.show({
        severity: 'success',
        summary: 'Success',
        key,
        ...config.onSuccess(result),
      });
      return result;
    } catch (error) {
      this.clear(key);
      await this.delay(transitionDelayMs);
      this.show({
        severity: 'error',
        summary: 'Something went wrong',
        key,
        ...config.onError(error),
      });
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
