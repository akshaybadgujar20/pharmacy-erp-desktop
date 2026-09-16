import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { MedicineSchedule } from './medicine-schedule.models';

export const MEDICINE_SCHEDULE_GRID_CONFIG: GridConfig<MedicineSchedule> = {
  id: 'medicine-schedule-grid',
  columns: [
    { field: 'scheduleCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'scheduleName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'requiresPrescription', headerName: 'Rx Required', type: 'boolean' },
    { field: 'controlledSubstance', headerName: 'Controlled', type: 'boolean' },
    { field: 'isSystemSchedule', headerName: 'System', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'MASTER:MEDICINE_SCHEDULE:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'MASTER:MEDICINE_SCHEDULE:DELETE',
      confirmation: true,
    },
  ],
};
