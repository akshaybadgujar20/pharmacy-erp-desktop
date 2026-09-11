export type ToolbarDirection = 'horizontal' | 'vertical';
export type ToolbarAlign = 'start' | 'center' | 'end' | 'between';

export interface ToolbarLayoutConfig {
  direction?: ToolbarDirection;
  align?: ToolbarAlign;
  gap?: string | number;
  wrap?: boolean;
}
