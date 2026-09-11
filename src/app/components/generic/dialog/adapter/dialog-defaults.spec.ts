import { applyConfirmPreset, getConfirmPresetDefaults } from './confirm-presets';
import {
  mergeConfirmConfig,
  mergeDialogConfig,
  mergeDrawerConfig,
  mergeDynamicDialogConfig,
  resolveConfirmConfig,
} from './dialog-defaults';

describe('dialog-defaults', () => {
  it('merges dialog config with defaults', () => {
    const merged = mergeDialogConfig({ header: 'Edit', width: '40rem' });
    expect(merged.modal).toBe(true);
    expect(merged.header).toBe('Edit');
    expect(merged.width).toBe('40rem');
  });

  it('merges drawer config with defaults', () => {
    const merged = mergeDrawerConfig({ position: 'left' });
    expect(merged.position).toBe('left');
    expect(merged.styleClass).toBe('w-96');
  });

  it('resolves boolean confirmation config', () => {
    const config = resolveConfirmConfig(true, 'Delete');
    expect(config.message).toContain('delete');
    expect(config.preset).toBe('info');
  });

  it('merges dynamic dialog config', () => {
    const merged = mergeDynamicDialogConfig({ header: 'Pick item', width: '30rem' });
    expect(merged.modal).toBe(true);
    expect(merged.header).toBe('Pick item');
  });
});

describe('confirm-presets', () => {
  it('applies danger preset accept button severity', () => {
    const config = applyConfirmPreset({ message: 'Delete?' }, 'danger');
    expect(config.acceptButtonProps?.severity).toBe('danger');
    expect(config.rejectButtonProps?.outlined).toBe(true);
  });

  it('returns info defaults', () => {
    const defaults = getConfirmPresetDefaults('info');
    expect(defaults.header).toBe('Confirmation');
  });
});
