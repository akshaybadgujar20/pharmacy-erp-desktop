export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center';

export type ToastMode = 'stacked' | 'expanded';

export interface ToastHostConfig {
  position?: ToastPosition;
  mode?: ToastMode;
  stackVisibleLimit?: number;
  key?: string;
  baseZIndex?: number;
}
