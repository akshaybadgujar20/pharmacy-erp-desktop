import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PrinterConfiguration } from './printer-configuration.models';

export const PRINTER_CONFIGURATION_GRID_CONFIG: GridConfig<PrinterConfiguration> = {
  id: 'printer-configuration-grid',
  columns: [
    { field: 'printerName', headerName: 'Printer Name', sortable: true, filterable: true },
    { field: 'printerType', headerName: 'Printer Type', filterable: true },
    { field: 'documentType', headerName: 'Document Type', filterable: true },
    { field: 'paperSize', headerName: 'Paper Size', filterable: true },
    { field: 'copies', headerName: 'Copies', type: 'number' },
    { field: 'printOrientation', headerName: 'Orientation', filterable: true },
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
      permission: 'CONFIGURATION:PRINTER_CONFIGURATION:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'CONFIGURATION:PRINTER_CONFIGURATION:DELETE',
      confirmation: true,
    },
  ],
};
