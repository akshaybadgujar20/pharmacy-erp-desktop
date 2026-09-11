import { ToolbarActionBase } from './toolbar-action-base.types';

export type ToolbarButtonSeverity =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warn'
  | 'help'
  | 'danger'
  | 'contrast';

export type ToolbarButtonVariant = 'text' | 'outlined' | 'link';

export type ToolbarIconPosition = 'left' | 'right' | 'top' | 'bottom';

export interface ToolbarButtonItemConfig extends ToolbarActionBase {
  type: 'button';
  severity?: ToolbarButtonSeverity;
  variant?: ToolbarButtonVariant;
  size?: 'small' | 'large';
  raised?: boolean;
  rounded?: boolean;
  iconOnly?: boolean;
  badge?: string | number;
  badgeSeverity?: string;
  iconPosition?: ToolbarIconPosition;
}
