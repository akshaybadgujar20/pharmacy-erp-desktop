import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppGridComponent } from '../../components/generic/grid';
import { AppToolbarComponent } from '../../components/generic/toolbar';
import {
  GridFilterChange,
  GridPageChange,
  GridRowClickEvent,
} from '../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { LOYALTY_PROGRAM_GRID_CONFIG } from './loyalty-program-grid.config';
import { LOYALTY_PROGRAM_TOOLBAR_CONFIG } from './loyalty-program-toolbar.config';
import { LoyaltyProgramRow, LoyaltyProgramService } from './loyalty-program.service';

@Component({
  selector: 'app-loyalty-program-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  template: `
    <app-toolbar [config]="toolbarConfig" (action)="onToolbarAction($event)" />
    <app-grid
      [config]="gridConfig"
      [data]="rows()"
      [loading]="loading()"
      [totalRecords]="totalRecords()"
      (pageChange)="onPageChange($event)"
      (filterChange)="onFilterChange($event)"
      (rowClick)="onRowClick($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyaltyProgramListComponent implements OnInit {
  private readonly loyaltyPrograms = inject(LoyaltyProgramService);
  private readonly router = inject(Router);

  readonly toolbarConfig = LOYALTY_PROGRAM_TOOLBAR_CONFIG;
  readonly gridConfig = LOYALTY_PROGRAM_GRID_CONFIG;
  readonly rows = signal<LoyaltyProgramRow[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);

  ngOnInit(): void {
    this.load();
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'create') {
      this.router.navigate(['/loyalty/programs/new']);
    }
    if (event.action === 'refresh') {
      this.load();
    }
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(_event: GridFilterChange): void {
    this.page.set(1);
    this.load();
  }

  onRowClick(event: GridRowClickEvent<LoyaltyProgramRow>): void {
    this.router.navigate(['/loyalty/programs', event.row.id]);
  }

  private load(): void {
    this.loading.set(true);
    this.loyaltyPrograms.list(String(this.page()), String(this.pageSize())).subscribe({
      next: ({ data, pagination }) => {
        this.rows.set(data);
        this.totalRecords.set(pagination.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
