import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PartyContact } from './party-contact.models';

export const PARTY_CONTACT_GRID_CONFIG: GridConfig<PartyContact> = {
  id: 'party-contact-grid',
  columns: [
    { field: 'contactType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'contactValue', headerName: 'Value', sortable: true, filterable: true },
    { field: 'countryCode', headerName: 'Country Code', sortable: true },
    { field: 'isPrimary', headerName: 'Primary', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'PARTY:PARTY:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PARTY:PARTY:DELETE',
      confirmation: true,
    },
  ],
};
