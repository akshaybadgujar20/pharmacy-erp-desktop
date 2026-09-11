export interface ToolbarActionEvent {
  action: string;
  source: 'button' | 'splitButton' | 'menu';
  parentId?: string;
  externalUrl?: string;
}
