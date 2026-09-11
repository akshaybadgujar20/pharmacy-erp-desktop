import { DEFAULT_TOOLBAR_CONFIG, mergeToolbarConfig } from './toolbar-defaults';
import { ToolbarConfig } from '../types/toolbar.types';

describe('toolbar-defaults', () => {
  const baseConfig: ToolbarConfig = {
    items: [{ type: 'button', id: 'save', label: 'Save' }],
  };

  it('applies default configuration', () => {
    const merged = mergeToolbarConfig(baseConfig);
    expect(merged.layout?.direction).toBe('horizontal');
    expect(merged.layout?.gap).toBe('0.5rem');
    expect(merged.appearance?.size).toBe('normal');
  });

  it('allows supplied configuration to override defaults', () => {
    const merged = mergeToolbarConfig({
      ...baseConfig,
      layout: { direction: 'vertical', align: 'end' },
    });
    expect(merged.layout?.direction).toBe('vertical');
    expect(merged.layout?.align).toBe('end');
  });

  it('does not mutate the input config', () => {
    const config: ToolbarConfig = {
      items: [{ type: 'button', id: 'save', label: 'Save', severity: 'primary' }],
      layout: { wrap: false },
    };
    mergeToolbarConfig(config);
    expect(config.layout?.wrap).toBe(false);
    expect(config.items[0].type).toBe('button');
  });

  it('exposes expected default constants', () => {
    expect(DEFAULT_TOOLBAR_CONFIG.layout?.direction).toBe('horizontal');
  });
});
