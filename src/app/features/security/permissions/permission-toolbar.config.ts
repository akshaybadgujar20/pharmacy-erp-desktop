import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const PERMISSION_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'permission-toolbar',
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
  ],
};
