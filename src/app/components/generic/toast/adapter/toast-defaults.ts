import { ToastHostConfig } from '../types/toast-host.types';
import { ToastMessageConfig } from '../types/toast-message.types';

export const DEFAULT_TOAST_HOST_KEY = 'app';

export const DEFAULT_TOAST_HOST_CONFIG: ToastHostConfig = {
  position: 'top-right',
  mode: 'stack',
  stackVisibleLimit: 3,
  key: DEFAULT_TOAST_HOST_KEY,
};

export const DEFAULT_TOAST_MESSAGE: Omit<ToastMessageConfig, 'summary'> = {
  severity: 'info',
  life: 3000,
  sticky: false,
  closable: true,
  key: DEFAULT_TOAST_HOST_KEY,
};

export function mergeToastHostConfig(config: ToastHostConfig = {}): ToastHostConfig {
  return {
    ...DEFAULT_TOAST_HOST_CONFIG,
    ...config,
  };
}

export function mergeToastMessageConfig(
  config: ToastMessageConfig,
): ToastMessageConfig {
  return {
    ...DEFAULT_TOAST_MESSAGE,
    ...config,
  };
}
