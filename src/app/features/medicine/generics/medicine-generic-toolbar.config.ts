import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const MEDICINE_GENERIC_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'medicine-generic-toolbar',
  layout: { direction: 'horizontal', align: 'between' },
  items: [
    { type: 'spacer' },
    {
      type: 'button',
      id: 'refresh',
      label: 'Refresh',
      icon: 'pi pi-refresh',
      variant: 'outlined',
      shortcutId: 'global.refresh',
    },
    {
      type: 'button',
      id: 'create',
      label: 'New Generic',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'MASTER:MEDICINE_GENERIC:CREATE',
    },
  ],
};
