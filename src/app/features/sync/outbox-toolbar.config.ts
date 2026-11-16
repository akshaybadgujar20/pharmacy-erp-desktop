import { ToolbarConfig } from '../../components/generic/toolbar/types/toolbar.types';

export const OUTBOX_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'outbox-toolbar',
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