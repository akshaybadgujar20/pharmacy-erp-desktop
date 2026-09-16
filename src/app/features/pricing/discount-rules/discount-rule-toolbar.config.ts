import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const DISCOUNT_RULE_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'discount-rule-toolbar',
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
      label: 'New Discount Rule',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'PRICING:DISCOUNT_RULE:CREATE',
    },
  ],
};
