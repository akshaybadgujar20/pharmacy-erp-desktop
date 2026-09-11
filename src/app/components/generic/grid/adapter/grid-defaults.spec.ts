import { DEFAULT_GRID_CONFIG, mergeGridConfig } from './grid-defaults';
import { GridConfig } from '../types/grid.types';

describe('grid-defaults', () => {
  const baseConfig: GridConfig<{ id: string; name: string }> = {
    columns: [{ field: 'name', headerName: 'Name' }],
  };

  it('applies default configuration', () => {
    const merged = mergeGridConfig(baseConfig);
    expect(merged.selection?.enabled).toBe(false);
    expect(merged.pagination?.pageSize).toBe(25);
    expect(merged.filtering?.debounce).toBe(300);
    expect(merged.appearance?.emptyMessage).toBe('No records found');
  });

  it('allows supplied configuration to override defaults', () => {
    const merged = mergeGridConfig({
      ...baseConfig,
      pagination: { pageSize: 50 },
      selection: { enabled: true, mode: 'multiple' },
    });
    expect(merged.pagination?.pageSize).toBe(50);
    expect(merged.selection?.enabled).toBe(true);
    expect(merged.selection?.mode).toBe('multiple');
  });

  it('does not mutate the input config', () => {
    const config: GridConfig<{ id: string; name: string }> = {
      columns: [{ field: 'name', headerName: 'Name', sortable: true }],
      pagination: { pageSize: 10 },
    };
    const originalPageSize = config.pagination?.pageSize;
    mergeGridConfig(config);
    expect(config.pagination?.pageSize).toBe(originalPageSize);
    expect(config.columns[0].sortable).toBe(true);
  });

  it('exposes expected default constants', () => {
    expect(DEFAULT_GRID_CONFIG.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
  });
});
