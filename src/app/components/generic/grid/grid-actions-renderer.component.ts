import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { GridActionConfig } from './types/grid-action.types';

export interface GridActionsRendererContext<T> {
  actions: GridActionConfig<T>[];
  hasPermission: (permission?: string) => boolean;
  onAction: (actionId: string, row: T) => void;
}

@Component({
  selector: 'app-grid-actions-renderer',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="app-grid-actions">
      @for (action of visibleActions(); track action.id) {
        <p-button
          type="button"
          [icon]="action.icon"
          [attr.title]="action.label"
          [disabled]="isDisabled(action)"
          severity="secondary"
          [text]="true"
          size="small"
          (onClick)="trigger(action.id)"
        />
      }
    </div>
  `,
  styles: [
    `
      .app-grid-actions {
        display: flex;
        gap: 0.25rem;
        align-items: center;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridActionsRendererComponent<T = unknown> implements ICellRendererAngularComp {
  private params!: ICellRendererParams<T> & { context: GridActionsRendererContext<T> };
  private row!: T;

  agInit(params: ICellRendererParams<T> & { context: GridActionsRendererContext<T> }): void {
    this.params = params;
    this.row = params.data as T;
  }

  refresh(params: ICellRendererParams<T> & { context: GridActionsRendererContext<T> }): boolean {
    this.params = params;
    this.row = params.data as T;
    return true;
  }

  visibleActions(): GridActionConfig<T>[] {
    const ctx = this.params.context;
    return ctx.actions.filter((action: GridActionConfig<T>) => {
      if (action.permission && !ctx.hasPermission(action.permission)) {
        return false;
      }
      if (action.visible && !action.visible(this.row)) {
        return false;
      }
      return true;
    });
  }

  isDisabled(action: GridActionConfig<T>): boolean {
    if (action.disabled?.(this.row)) {
      return true;
    }
    return false;
  }

  trigger(actionId: string): void {
    this.params.context.onAction(actionId, this.row);
  }
}
