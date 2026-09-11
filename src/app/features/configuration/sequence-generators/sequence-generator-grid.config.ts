import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SequenceGenerator } from './sequence-generator.models';

export const SEQUENCE_GENERATOR_GRID_CONFIG: GridConfig<SequenceGenerator> = {
  id: 'sequence-generator-grid',
  columns: [
    { field: 'documentType', headerName: 'Document Type', sortable: true, filterable: true },
    { field: 'prefix', headerName: 'Prefix', filterable: true },
    { field: 'suffix', headerName: 'Suffix', filterable: true },
    { field: 'currentNumber', headerName: 'Current Number' },
    { field: 'resetPolicy', headerName: 'Reset Policy', filterable: true },
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
      permission: 'CONFIGURATION:SEQUENCE_GENERATOR:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'CONFIGURATION:SEQUENCE_GENERATOR:DELETE',
      confirmation: true,
    },
  ],
};
