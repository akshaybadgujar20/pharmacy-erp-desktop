import { ToolbarConfig } from '../../components/generic/toolbar/types/toolbar.types';

export const AUDIT_LOG_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'audit-log-toolbar',
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
