import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { BarcodeConfiguration } from './barcode-configuration.models';

export const BARCODE_CONFIGURATION_GRID_CONFIG: GridConfig<BarcodeConfiguration> = {
  id: 'barcode-configuration-grid',
  columns: [
    { field: 'configurationName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'barcodeType', headerName: 'Barcode Type', filterable: true },
    { field: 'appliesTo', headerName: 'Applies To', filterable: true },
    { field: 'labelWidth', headerName: 'Label Width' },
    { field: 'labelHeight', headerName: 'Label Height' },
    { field: 'dpi', headerName: 'DPI', type: 'number' },
    { field: 'isDefault', headerName: 'Default', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'CONFIGURATION:BARCODE_CONFIGURATION:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'CONFIGURATION:BARCODE_CONFIGURATION:DELETE',
      confirmation: true,
    },
  ],
};
