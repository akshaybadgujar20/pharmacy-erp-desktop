import { DialogButtonConfig } from './dialog-button.types';

export type DialogPosition =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center'
  | 'topleft'
  | 'topright'
  | 'bottomleft'
  | 'bottomright';

export interface DialogFooterConfig {
  buttons: DialogButtonConfig[];
}

export interface DialogConfig {
  id?: string;
  header?: string;
  modal?: boolean;
  closable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  dismissableMask?: boolean;
  closeOnEscape?: boolean;
  blockScroll?: boolean;
  maximizable?: boolean;
  position?: DialogPosition;
  width?: string;
  style?: Record<string, string>;
  styleClass?: string;
  breakpoints?: Record<string, string>;
  footer?: DialogFooterConfig;
}
