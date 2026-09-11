import { ToolbarButtonItemConfig } from './toolbar-button.types';
import { ToolbarButtonGroupItemConfig } from './toolbar-group.types';
import { ToolbarSplitButtonItemConfig } from './toolbar-split-button.types';

export interface ToolbarSeparatorItemConfig {
  type: 'separator';
  id?: string;
}

export interface ToolbarSpacerItemConfig {
  type: 'spacer';
  id?: string;
}

export type ToolbarItemConfig =
  | ToolbarButtonItemConfig
  | ToolbarSplitButtonItemConfig
  | ToolbarButtonGroupItemConfig
  | ToolbarSeparatorItemConfig
  | ToolbarSpacerItemConfig;

export type ToolbarActionItemConfig =
  | ToolbarButtonItemConfig
  | ToolbarSplitButtonItemConfig;
