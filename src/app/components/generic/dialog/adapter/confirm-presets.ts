import { ConfirmDialogConfig, ConfirmPreset } from '../types/confirm-dialog.types';

export const CONFIRM_PRESET_INFO: Partial<ConfirmDialogConfig> = {
  header: 'Confirmation',
  icon: 'pi pi-exclamation-triangle',
  acceptLabel: 'Yes',
  rejectLabel: 'No',
  rejectButtonProps: {
    label: 'No',
    severity: 'secondary',
    outlined: true,
  },
  acceptButtonProps: {
    label: 'Yes',
  },
};

export const CONFIRM_PRESET_DANGER: Partial<ConfirmDialogConfig> = {
  header: 'Danger Zone',
  icon: 'pi pi-info-circle',
  acceptLabel: 'Delete',
  rejectLabel: 'Cancel',
  rejectButtonProps: {
    label: 'Cancel',
    severity: 'secondary',
    outlined: true,
  },
  acceptButtonProps: {
    label: 'Delete',
    severity: 'danger',
  },
};

export function getConfirmPresetDefaults(preset: ConfirmPreset): Partial<ConfirmDialogConfig> {
  switch (preset) {
    case 'danger':
      return CONFIRM_PRESET_DANGER;
    case 'info':
      return CONFIRM_PRESET_INFO;
    case 'custom':
    default:
      return {};
  }
}

export function applyConfirmPreset(
  config: ConfirmDialogConfig,
  preset: ConfirmPreset = config.preset ?? 'info',
): ConfirmDialogConfig {
  if (preset === 'custom') {
    return { ...config, preset };
  }
  const defaults = getConfirmPresetDefaults(preset);
  return {
    ...defaults,
    ...config,
    preset,
    acceptButtonProps: { ...defaults.acceptButtonProps, ...config.acceptButtonProps },
    rejectButtonProps: { ...defaults.rejectButtonProps, ...config.rejectButtonProps },
  };
}
