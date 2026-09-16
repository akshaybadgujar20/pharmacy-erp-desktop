import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Prescription } from './prescription.models';

export const PRESCRIPTION_GRID_CONFIG: GridConfig<Prescription> = {
  id: 'prescription-grid',
  columns: [
    {
      field: 'prescriptionNumber',
      headerName: 'Number',
      sortable: true,
      filterable: true,
    },
    { field: 'customerId', headerName: 'Customer ID', sortable: true, filterable: true },
    { field: 'doctorId', headerName: 'Doctor ID', sortable: true, filterable: true },
    { field: 'prescriptionDate', headerName: 'Date', type: 'datetime', sortable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'visitNumber', headerName: 'Visit No', sortable: true, filterable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PRESCRIPTION:PRESCRIPTION:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PRESCRIPTION:PRESCRIPTION:DELETE',
      confirmation: true,
    },
  ],
};
