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
import { PAYMENT_GRID_CONFIG } from './payment-grid.config';
import { PAYMENT_TOOLBAR_CONFIG } from './payment-toolbar.config';
import { Payment } from './payment.models';
import { PaymentService } from './payment.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './payment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent implements OnInit, OnDestroy {
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = PAYMENT_TOOLBAR_CONFIG;
  readonly gridConfig = PAYMENT_GRID_CONFIG;

  readonly rows = signal<Payment[]>([]);
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

  onGridAction(event: GridActionEvent<Payment>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/finance/payments', event.row.id]);
    }
    if (event.action === 'delete') {
      this.paymentService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<Payment>): void {
    this.router.navigate(['/finance/payments', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/finance/payments/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.paymentService
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
