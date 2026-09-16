import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const UNIT_OF_MEASURE_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'unit-of-measure-toolbar',
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
      label: 'New Unit',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'MASTER:UNIT_OF_MEASURE:CREATE',
    },
  ],
};
