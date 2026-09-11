import { DialogFooterConfig } from './dialog.types';

export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerConfig {
  id?: string;
  header?: string;
  modal?: boolean;
  dismissible?: boolean;
  closable?: boolean;
  closeOnEscape?: boolean;
  blockScroll?: boolean;
  fullScreen?: boolean;
  position?: DrawerPosition;
  style?: Record<string, string>;
  styleClass?: string;
  footer?: DialogFooterConfig;
}
