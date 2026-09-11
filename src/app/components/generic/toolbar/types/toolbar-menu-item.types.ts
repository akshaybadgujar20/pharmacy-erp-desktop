export interface ToolbarMenuItemConfig {
  id?: string;
  label?: string;
  icon?: string;
  separator?: boolean;
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  role?: string;
  roles?: string[];
  disabled?: boolean;
  visible?: boolean;
  externalUrl?: string;
  items?: ToolbarMenuItemConfig[];
}
