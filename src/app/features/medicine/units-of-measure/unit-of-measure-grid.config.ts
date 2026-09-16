import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { UnitOfMeasure } from './unit-of-measure.models';

export const UNIT_OF_MEASURE_GRID_CONFIG: GridConfig<UnitOfMeasure> = {
  id: 'unit-of-measure-grid',
  columns: [
    { field: 'unitCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'unitName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'shortName', headerName: 'Short Name', sortable: true, filterable: true },
    { field: 'unitType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'decimalAllowed', headerName: 'Decimal Allowed', type: 'boolean' },
    { field: 'isSystemUnit', headerName: 'System', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:UNIT_OF_MEASURE:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:UNIT_OF_MEASURE:DELETE',
      confirmation: true,
    },
  ],
};
