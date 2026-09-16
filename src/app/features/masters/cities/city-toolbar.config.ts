import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const CITY_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'city-toolbar',
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
      label: 'New City',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'LOOKUP:CITY:CREATE',
    },
  ],
};
