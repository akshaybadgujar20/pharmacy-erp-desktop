import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppGridComponent } from '../../components/generic/grid';
import {
  GridFilterChange,
  GridRowClickEvent,
} from '../../components/generic/grid/types/grid-events.types';
import { REPORT_LIST_GRID_CONFIG } from './report-list-grid.config';
import { ReportDefinitionMeta } from './report.models';
import { ReportService } from './report.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [AppGridComponent],
  templateUrl: './report-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportListComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly router = inject(Router);

  readonly gridConfig = REPORT_LIST_GRID_CONFIG;

  readonly allRows = signal<ReportDefinitionMeta[]>([]);
  readonly rows = signal<ReportDefinitionMeta[]>([]);
  readonly loading = signal(false);
  readonly search = signal('');

  ngOnInit(): void {
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.applyFilter();
  }

  onRowDoubleClick(event: GridRowClickEvent<ReportDefinitionMeta>): void {
    this.router.navigate(['/reports', event.row.id]);
  }

  private load(): void {
    this.loading.set(true);
    this.reportService.list().subscribe({
      next: (reports) => {
        this.allRows.set(reports);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private applyFilter(): void {
    const search = this.search().trim().toLowerCase();
    if (!search) {
      this.rows.set(this.allRows());
      return;
    }

    this.rows.set(
      this.allRows().filter(
        (report) =>
          report.id.toLowerCase().includes(search) ||
          report.name.toLowerCase().includes(search) ||
          report.category.toLowerCase().includes(search),
      ),
    );
  }
}
