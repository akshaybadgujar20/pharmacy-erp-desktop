import { applyConfirmPreset } from './confirm-presets';
import { ConfirmDialogConfig } from '../types/confirm-dialog.types';
import { DialogConfig } from '../types/dialog.types';
import { DrawerConfig } from '../types/drawer.types';
import { DynamicDialogConfig } from '../types/dynamic-dialog.types';

export const DEFAULT_DIALOG_CONFIG: DialogConfig = {
  modal: true,
  closable: true,
  closeOnEscape: true,
  dismissableMask: false,
  draggable: false,
  resizable: false,
  blockScroll: true,
  maximizable: false,
  position: 'center',
  width: '30rem',
};

export const DEFAULT_DRAWER_CONFIG: DrawerConfig = {
  modal: true,
  dismissible: true,
  closable: true,
  closeOnEscape: true,
  blockScroll: true,
  fullScreen: false,
  position: 'right',
  styleClass: 'w-96',
};

export const DEFAULT_CONFIRM_CONFIG: ConfirmDialogConfig = {
  message: 'Are you sure?',
  closable: true,
  closeOnEscape: true,
  preset: 'info',
};

export const DEFAULT_DYNAMIC_DIALOG_CONFIG: DynamicDialogConfig = {
  modal: true,
  closable: true,
  closeOnEscape: true,
  dismissableMask: false,
  maximizable: false,
  width: '50vw',
};

export function mergeDialogConfig(config: DialogConfig): DialogConfig {
  return {
    ...DEFAULT_DIALOG_CONFIG,
    ...config,
    style: { ...config.style },
    breakpoints: config.breakpoints ? { ...config.breakpoints } : undefined,
    footer: config.footer
      ? { buttons: config.footer.buttons.map((button) => ({ ...button })) }
      : undefined,
  };
}

export function mergeDrawerConfig(config: DrawerConfig): DrawerConfig {
  return {
    ...DEFAULT_DRAWER_CONFIG,
    ...config,
    style: config.style ? { ...config.style } : undefined,
    footer: config.footer
      ? { buttons: config.footer.buttons.map((button) => ({ ...button })) }
      : undefined,
  };
}

export function mergeConfirmConfig(config: ConfirmDialogConfig): ConfirmDialogConfig {
  const merged = {
    ...DEFAULT_CONFIRM_CONFIG,
    ...config,
    acceptButtonProps: { ...config.acceptButtonProps },
    rejectButtonProps: { ...config.rejectButtonProps },
  };
  return applyConfirmPreset(merged, merged.preset ?? 'info');
}

export function mergeDynamicDialogConfig(config: DynamicDialogConfig = {}): DynamicDialogConfig {
  return {
    ...DEFAULT_DYNAMIC_DIALOG_CONFIG,
    ...config,
    contentStyle: config.contentStyle ? { ...config.contentStyle } : undefined,
    breakpoints: config.breakpoints ? { ...config.breakpoints } : undefined,
    data: config.data ? { ...config.data } : undefined,
    inputValues: config.inputValues ? { ...config.inputValues } : undefined,
  };
}

export function resolveConfirmConfig(
  confirmation: boolean | ConfirmDialogConfig,
  label?: string,
): ConfirmDialogConfig {
  if (typeof confirmation === 'boolean') {
    return mergeConfirmConfig({
      message: `Are you sure you want to ${label?.toLowerCase() ?? 'continue'}?`,
      preset: 'info',
    });
  }
  return mergeConfirmConfig(confirmation);
}
