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
import { ReportFavorite, ReportFavoriteService } from './report-favorite.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [AppGridComponent],
  templateUrl: './report-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportListComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly favorites = inject(ReportFavoriteService);
  private readonly router = inject(Router);

  readonly gridConfig = REPORT_LIST_GRID_CONFIG;

  readonly allRows = signal<ReportDefinitionMeta[]>([]);
  readonly rows = signal<ReportDefinitionMeta[]>([]);
  readonly loading = signal(false);
  readonly search = signal('');
  readonly category = signal('');
  readonly favoriteReports = signal<ReportDefinitionMeta[]>([]);

  ngOnInit(): void {
    this.load();
  }

  openFavorite(report: ReportDefinitionMeta): void {
    this.router.navigate(['/reports', report.id]);
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
        this.favorites.list().subscribe({
          next: (favRows: ReportFavorite[]) => {
            const codes = new Set(favRows.map((row) => row.reportCode));
            this.favoriteReports.set(
              reports.filter((report) => codes.has(report.id)),
            );
          },
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setCategory(value: string): void {
    this.category.set(value);
    this.applyFilter();
  }

  private applyFilter(): void {
    const search = this.search().trim().toLowerCase();
    const category = this.category().trim().toLowerCase();
    this.rows.set(
      this.allRows().filter((report) => {
        const matchesSearch =
          !search ||
          report.id.toLowerCase().includes(search) ||
          report.name.toLowerCase().includes(search) ||
          report.category.toLowerCase().includes(search);
        const matchesCategory =
          !category || report.category.toLowerCase() === category;
        return matchesSearch && matchesCategory;
      }),
    );
  }
}
