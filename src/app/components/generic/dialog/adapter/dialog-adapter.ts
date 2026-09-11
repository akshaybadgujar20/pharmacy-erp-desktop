import { Confirmation } from 'primeng/api';
import { mergeConfirmConfig, mergeDialogConfig, mergeDrawerConfig, mergeDynamicDialogConfig } from './dialog-defaults';
import { ConfirmDialogConfig } from '../types/confirm-dialog.types';
import { ConfirmPopupConfig } from '../types/confirm-popup.types';
import { DialogConfig } from '../types/dialog.types';
import { DrawerConfig } from '../types/drawer.types';
import { DynamicDialogConfig } from '../types/dynamic-dialog.types';

export interface PrimeDialogBindings {
  header?: string;
  modal: boolean;
  closable: boolean;
  draggable: boolean;
  resizable: boolean;
  dismissableMask: boolean;
  closeOnEscape: boolean;
  blockScroll: boolean;
  maximizable: boolean;
  position?: DialogConfig['position'];
  style?: Record<string, string>;
  styleClass?: string;
  breakpoints?: Record<string, string>;
}

export interface PrimeDrawerBindings {
  header?: string;
  modal: boolean;
  dismissible: boolean;
  closable: boolean;
  closeOnEscape: boolean;
  blockScroll: boolean;
  fullScreen: boolean;
  position: NonNullable<DrawerConfig['position']>;
  style?: Record<string, string>;
  styleClass?: string;
}

export function toPrimeConfirmOptions(
  config: ConfirmDialogConfig,
  accept: () => void,
  reject: () => void,
): Confirmation {
  const merged = mergeConfirmConfig(config);
  return {
    message: merged.message,
    header: merged.header,
    icon: merged.icon,
    acceptLabel: merged.acceptLabel ?? merged.acceptButtonProps?.label,
    rejectLabel: merged.rejectLabel ?? merged.rejectButtonProps?.label,
    acceptButtonProps: merged.acceptButtonProps,
    rejectButtonProps: merged.rejectButtonProps,
    closable: merged.closable,
    closeOnEscape: merged.closeOnEscape,
    key: merged.key,
    position: merged.position,
    accept,
    reject,
  };
}

export function toPrimeConfirmPopupOptions(
  config: ConfirmPopupConfig,
  target: EventTarget,
  accept: () => void,
  reject: () => void,
): Confirmation {
  return {
    ...toPrimeConfirmOptions(config, accept, reject),
    target,
  };
}

export function toPrimeDialogBindings(config: DialogConfig): PrimeDialogBindings {
  const merged = mergeDialogConfig(config);
  const style = merged.width
    ? { width: merged.width, ...merged.style }
    : merged.style;

  return {
    header: merged.header,
    modal: merged.modal ?? true,
    closable: merged.closable ?? true,
    draggable: merged.draggable ?? false,
    resizable: merged.resizable ?? false,
    dismissableMask: merged.dismissableMask ?? false,
    closeOnEscape: merged.closeOnEscape ?? true,
    blockScroll: merged.blockScroll ?? true,
    maximizable: merged.maximizable ?? false,
    position: merged.position,
    style,
    styleClass: merged.styleClass,
    breakpoints: merged.breakpoints,
  };
}

export function toPrimeDrawerBindings(config: DrawerConfig): PrimeDrawerBindings {
  const merged = mergeDrawerConfig(config);
  return {
    header: merged.header,
    modal: merged.modal ?? true,
    dismissible: merged.dismissible ?? true,
    closable: merged.closable ?? true,
    closeOnEscape: merged.closeOnEscape ?? true,
    blockScroll: merged.blockScroll ?? true,
    fullScreen: merged.fullScreen ?? false,
    position: merged.position ?? 'right',
    style: merged.style,
    styleClass: merged.styleClass,
  };
}

export function toDynamicDialogOptions(config: DynamicDialogConfig): DynamicDialogConfig {
  return mergeDynamicDialogConfig(config);
}
