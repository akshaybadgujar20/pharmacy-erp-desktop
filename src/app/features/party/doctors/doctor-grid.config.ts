import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Doctor } from './doctor.models';

export const DOCTOR_GRID_CONFIG: GridConfig<Doctor> = {
  id: 'doctor-grid',
  columns: [
    { field: 'doctorCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'registrationNumber', headerName: 'Registration', sortable: true, filterable: true },
    { field: 'specialization', headerName: 'Specialization', sortable: true, filterable: true },
    { field: 'hospitalName', headerName: 'Hospital', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'PARTY:DOCTOR:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PARTY:DOCTOR:DELETE',
      confirmation: true,
    },
  ],
};
