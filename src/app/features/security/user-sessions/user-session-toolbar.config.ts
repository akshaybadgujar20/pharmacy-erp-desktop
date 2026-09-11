import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const USER_SESSION_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'user-session-toolbar',
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
