import {
  ToastHostConfig,
  ToastMode,
  ToastPosition,
} from '../types/toast-host.types';
import { ToastMessageConfig } from '../types/toast-message.types';

export type ResolvedToastHostConfig = ToastHostConfig & {
  position: ToastPosition;
  mode: ToastMode;
  stackVisibleLimit: number;
  key: string;
};

export const DEFAULT_TOAST_HOST_KEY = 'app';

export const DEFAULT_TOAST_HOST_CONFIG: ResolvedToastHostConfig = {
  position: 'top-right',
  mode: 'stacked',
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

export function mergeToastHostConfig(
  config: ToastHostConfig = {},
): ResolvedToastHostConfig {
  return {
    ...DEFAULT_TOAST_HOST_CONFIG,
    ...config,
  } satisfies ResolvedToastHostConfig;
}

export function mergeToastMessageConfig(
  config: ToastMessageConfig,
): ToastMessageConfig {
  return {
    ...DEFAULT_TOAST_MESSAGE,
    ...config,
  };
}
