import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { AppSetting } from './setting.models';

export const SETTING_GRID_CONFIG: GridConfig<AppSetting> = {
  id: 'setting-grid',
  columns: [
    { field: 'settingKey', headerName: 'Key', sortable: true, filterable: true },
    { field: 'settingName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'category', headerName: 'Category', sortable: true, filterable: true },
    { field: 'dataType', headerName: 'Data Type', sortable: true, filterable: true },
    { field: 'settingValue', headerName: 'Value', filterable: true },
    { field: 'isEditable', headerName: 'Editable', type: 'boolean' },
  ],
  row: { getId: (row) => row.settingKey, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: false, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: false },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'CONFIGURATION:APP_SETTING:UPDATE',
    },
  ],
};
