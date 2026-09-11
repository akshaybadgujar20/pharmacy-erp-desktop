import { ToastMessageConfig } from './toast-message.types';

export interface ToastPromiseConfig<T> {
  key?: string;
  loading?: Partial<ToastMessageConfig>;
  task: () => Promise<T>;
  onSuccess: (result: T) => Partial<ToastMessageConfig>;
  onError: (error: unknown) => Partial<ToastMessageConfig>;
  transitionDelayMs?: number;
}
