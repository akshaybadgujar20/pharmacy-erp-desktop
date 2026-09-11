import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const PRINTER_CONFIGURATION_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'printer-configuration-toolbar',
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
      label: 'New Printer Configuration',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'CONFIGURATION:PRINTER_CONFIGURATION:CREATE',
    },
  ],
};
