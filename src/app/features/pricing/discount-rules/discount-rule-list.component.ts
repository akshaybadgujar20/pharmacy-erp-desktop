import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
  GridRowClickEvent,
} from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { DISCOUNT_RULE_GRID_CONFIG } from './discount-rule-grid.config';
import { DISCOUNT_RULE_TOOLBAR_CONFIG } from './discount-rule-toolbar.config';
import { DiscountRule } from './discount-rule.models';
import { DiscountRuleService } from './discount-rule.service';

@Component({
  selector: 'app-discount-rule-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './discount-rule-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountRuleListComponent implements OnInit, OnDestroy {
  private readonly discountRuleService = inject(DiscountRuleService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = DISCOUNT_RULE_TOOLBAR_CONFIG;
  readonly gridConfig = DISCOUNT_RULE_GRID_CONFIG;

  readonly rows = signal<DiscountRule[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

  ngOnInit(): void {
    this.shortcuts.registerHandler('global.refresh', () => this.load());
    this.shortcuts.registerHandler('global.new', () => this.onNew());
    this.load();
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
    this.shortcuts.unregisterHandler('global.new');
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'refresh') {
      this.load();
    }
    if (event.action === 'create') {
      this.onNew();
    }
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  onGridAction(event: GridActionEvent<DiscountRule>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/pricing/discount-rules', event.row.id]);
    }
    if (event.action === 'delete') {
      this.discountRuleService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<DiscountRule>): void {
    this.router.navigate(['/pricing/discount-rules', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/pricing/discount-rules/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.discountRuleService
      .list(toListParams(this.page(), this.pageSize(), this.search()))
      .subscribe({
        next: (result) => {
          this.rows.set(result.data);
          this.totalRecords.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
