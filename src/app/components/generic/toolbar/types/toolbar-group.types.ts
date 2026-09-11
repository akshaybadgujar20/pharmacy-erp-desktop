import { ToolbarButtonItemConfig } from './toolbar-button.types';
import { ToolbarSplitButtonItemConfig } from './toolbar-split-button.types';

export interface ToolbarButtonGroupItemConfig {
  type: 'buttonGroup';
  id?: string;
  items: Array<ToolbarButtonItemConfig | ToolbarSplitButtonItemConfig>;
}
