import {
  DEFAULT_TOAST_HOST_CONFIG,
  DEFAULT_TOAST_MESSAGE,
  mergeToastHostConfig,
  mergeToastMessageConfig,
} from './toast-defaults';

describe('toast-defaults', () => {
  it('applies default host configuration', () => {
    const merged = mergeToastHostConfig();
    expect(merged.position).toBe('top-right');
    expect(merged.mode).toBe('stack');
    expect(merged.stackVisibleLimit).toBe(3);
    expect(merged.key).toBe('app');
  });

  it('allows supplied host configuration to override defaults', () => {
    const merged = mergeToastHostConfig({
      position: 'bottom-center',
      mode: 'expanded',
      key: 'custom',
    });
    expect(merged.position).toBe('bottom-center');
    expect(merged.mode).toBe('expanded');
    expect(merged.key).toBe('custom');
    expect(merged.stackVisibleLimit).toBe(3);
  });

  it('does not mutate the input host config', () => {
    const config = { position: 'center' as const };
    mergeToastHostConfig(config);
    expect(config.position).toBe('center');
    expect(config).not.toHaveProperty('mode');
  });

  it('applies default message configuration', () => {
    const merged = mergeToastMessageConfig({ summary: 'Saved' });
    expect(merged.severity).toBe('info');
    expect(merged.life).toBe(3000);
    expect(merged.sticky).toBe(false);
    expect(merged.closable).toBe(true);
    expect(merged.key).toBe('app');
  });

  it('allows supplied message configuration to override defaults', () => {
    const merged = mergeToastMessageConfig({
      summary: 'Failed',
      severity: 'error',
      sticky: true,
      key: 'promise',
    });
    expect(merged.severity).toBe('error');
    expect(merged.sticky).toBe(true);
    expect(merged.key).toBe('promise');
  });

  it('exposes expected default constants', () => {
    expect(DEFAULT_TOAST_HOST_CONFIG.position).toBe('top-right');
    expect(DEFAULT_TOAST_MESSAGE.life).toBe(3000);
  });
});
