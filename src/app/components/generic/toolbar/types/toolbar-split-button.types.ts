import { ToolbarActionBase } from './toolbar-action-base.types';
import { ToolbarButtonSeverity, ToolbarButtonVariant } from './toolbar-button.types';
import { ToolbarMenuItemConfig } from './toolbar-menu-item.types';

export interface ToolbarSplitButtonItemConfig extends ToolbarActionBase {
  type: 'splitButton';
  severity?: ToolbarButtonSeverity;
  variant?: ToolbarButtonVariant;
  size?: 'small' | 'large';
  raised?: boolean;
  rounded?: boolean;
  dropdownIcon?: string;
  buttonDisabled?: boolean;
  menuButtonDisabled?: boolean;
  menuItems: ToolbarMenuItemConfig[];
}
