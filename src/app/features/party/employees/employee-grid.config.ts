import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Employee } from './employee.models';

export const EMPLOYEE_GRID_CONFIG: GridConfig<Employee> = {
  id: 'employee-grid',
  columns: [
    { field: 'employeeCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'designation', headerName: 'Designation', sortable: true, filterable: true },
    { field: 'department', headerName: 'Department', sortable: true, filterable: true },
    { field: 'isPharmacist', headerName: 'Pharmacist', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'PARTY:EMPLOYEE:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PARTY:EMPLOYEE:DELETE',
      confirmation: true,
    },
  ],
};
