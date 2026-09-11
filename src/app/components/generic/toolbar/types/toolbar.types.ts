import { ToolbarAppearanceConfig } from './toolbar-appearance.types';
import { ToolbarItemConfig } from './toolbar-item.types';
import { ToolbarLayoutConfig } from './toolbar-layout.types';

export interface ToolbarConfig {
  id?: string;
  layout?: ToolbarLayoutConfig;
  appearance?: ToolbarAppearanceConfig;
  items: ToolbarItemConfig[];
}
