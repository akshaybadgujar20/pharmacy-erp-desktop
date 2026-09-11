import { GridActionConfig } from './grid-action.types';
import { GridAppearanceConfig } from './grid-appearance.types';
import { GridColumn } from './grid-column.types';
import { GridDataSourceConfig } from './grid-data-source.types';
import { GridExportConfig } from './grid-export.types';
import { GridFilteringConfig } from './grid-filter.types';
import { GridPaginationConfig } from './grid-pagination.types';
import { GridRowConfig } from './grid-row.types';
import { GridSelectionConfig } from './grid-selection.types';
import { GridSortingConfig } from './grid-sort.types';
import { GridStateConfig } from './grid-state.types';
import { GridToolbarConfig } from './grid-toolbar.types';

export interface GridConfig<T = unknown> {
  id?: string;
  columns: GridColumn<T>[];
  dataSource?: GridDataSourceConfig;
  row?: GridRowConfig<T>;
  selection?: GridSelectionConfig<T>;
  sorting?: GridSortingConfig;
  filtering?: GridFilteringConfig;
  pagination?: GridPaginationConfig;
  actions?: GridActionConfig<T>[];
  toolbar?: GridToolbarConfig;
  export?: GridExportConfig;
  state?: GridStateConfig;
  appearance?: GridAppearanceConfig;
}
