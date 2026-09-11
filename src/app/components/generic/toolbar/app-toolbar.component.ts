import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitButtonModule } from 'primeng/splitbutton';
import { AuthService } from '../../../core/services/auth.service';
import { mergeToolbarConfig } from './adapter/toolbar-defaults';
import { toPrimeMenuItems } from './adapter/toolbar-menu.adapter';
import {
  createAccessContext,
  filterToolbarItems,
  isActionItemDisabled,
  isItemLoading,
} from './adapter/toolbar-visibility';
import { ToolbarConfirmConfig } from './types/toolbar-action-base.types';
import { ToolbarActionEvent } from './types/toolbar-events.types';
import { ToolbarActionItemConfig, ToolbarItemConfig } from './types/toolbar-item.types';
import { ToolbarSplitButtonItemConfig } from './types/toolbar-split-button.types';
import { ToolbarConfig } from './types/toolbar.types';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ButtonModule,
    ButtonGroupModule,
    SplitButtonModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './app-toolbar.component.html',
  styleUrl: './app-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppToolbarComponent {
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);

  config = input.required<ToolbarConfig>();
  loading = input<Record<string, boolean>>({});

  action = output<ToolbarActionEvent>();

  readonly mergedConfig = computed(() => mergeToolbarConfig(this.config()));
  readonly layout = computed(() => this.mergedConfig().layout ?? {});
  readonly visibleItems = computed(() => {
    const access = createAccessContext(this.authService);
    return filterToolbarItems(this.mergedConfig().items, access);
  });

  trackItem(index: number, item: ToolbarItemConfig): string {
    if (item.type === 'separator' || item.type === 'spacer') {
      return `${item.type}-${index}`;
    }
    if (item.type === 'buttonGroup') {
      return item.id ?? `buttonGroup-${index}`;
    }
    return item.id;
  }

  isLoading(itemId: string): boolean {
    return isItemLoading(itemId, this.loading());
  }

  isDisabled(item: ToolbarActionItemConfig): boolean {
    return isActionItemDisabled(item, this.loading());
  }

  getMenuModel(item: ToolbarSplitButtonItemConfig): MenuItem[] {
    const access = createAccessContext(this.authService);
    return toPrimeMenuItems(item.menuItems, access, item.id, (event) =>
      this.emitAction(event),
    );
  }

  onButtonClick(item: ToolbarActionItemConfig): void {
    this.handleAction(
      {
        action: item.id,
        source: 'button',
        externalUrl: item.externalUrl,
      },
      item.confirmation,
      item.label,
    );
  }

  onSplitButtonClick(item: ToolbarSplitButtonItemConfig): void {
    this.handleAction(
      {
        action: item.id,
        source: 'splitButton',
        externalUrl: item.externalUrl,
      },
      item.confirmation,
      item.label,
    );
  }

  private handleAction(
    event: ToolbarActionEvent,
    confirmation?: boolean | ToolbarConfirmConfig,
    label?: string,
  ): void {
    if (!confirmation) {
      this.emitAction(event);
      return;
    }
    const config =
      typeof confirmation === 'boolean'
        ? {
            message: `Are you sure you want to ${label?.toLowerCase() ?? 'continue'}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
          }
        : confirmation;
    this.confirmationService.confirm({
      message: config.message ?? 'Are you sure?',
      header: config.header ?? 'Confirm',
      icon: config.icon ?? 'pi pi-exclamation-triangle',
      acceptLabel: config.acceptLabel ?? 'Yes',
      rejectLabel: config.rejectLabel ?? 'No',
      accept: () => this.emitAction(event),
    });
  }

  private emitAction(event: ToolbarActionEvent): void {
    this.action.emit(event);
  }
}
