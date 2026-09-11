import { AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';
import { AppGridComponent } from '../generic/grid';
import { AppToolbarComponent } from '../generic/toolbar';
import { GridConfig } from '../generic/grid/types/grid.types';
import { ToolbarConfig } from '../generic/toolbar/types/toolbar.types';

Chart.register(...registerables);

interface DemoRow {
  id: string;
  name: string;
  city: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    AppGridComponent,
    AppToolbarComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class DashboardComponent implements AfterViewInit {

  readonly toolbarConfig: ToolbarConfig = {
    id: 'dashboard-toolbar',
    layout: { direction: 'horizontal', align: 'between' },
    items: [
      { type: 'button', id: 'refresh', label: 'Refresh', icon: 'pi pi-refresh', variant: 'outlined' },
      { type: 'spacer' },
      {
        type: 'splitButton',
        id: 'export',
        label: 'Export',
        icon: 'pi pi-download',
        menuItems: [
          { id: 'export-csv', label: 'CSV', icon: 'pi pi-file' },
          { id: 'export-excel', label: 'Excel', icon: 'pi pi-file-excel' },
        ],
      },
      {
        type: 'buttonGroup',
        id: 'demo-group',
        items: [
          { type: 'button', id: 'edit', label: 'Edit', icon: 'pi pi-pencil', variant: 'outlined' },
          { type: 'button', id: 'delete', label: 'Delete', icon: 'pi pi-trash', severity: 'danger', confirmation: true },
        ],
      },
    ],
  };

  readonly gridConfig: GridConfig<DemoRow> = {
    id: 'dashboard-demo-grid',
    columns: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', sortable: true, filterable: true },
      { field: 'city', headerName: 'City', sortable: true, filterable: true },
    ],
    row: { getId: (row) => row.id },
    pagination: { enabled: true, pageSize: 10 },
    filtering: { enabled: true, globalSearch: true },
    toolbar: { enabled: true, search: true, refresh: true },
  };

  readonly rowData: DemoRow[] = [
    { id: '1', name: 'John', city: 'London' },
    { id: '2', name: 'Jane', city: 'Manchester' },
    { id: '3', name: 'Alex', city: 'Birmingham' }
  ];

  @ViewChild('salesChart1')
  chartCanvas1!: ElementRef<HTMLCanvasElement>;

  @ViewChild('salesChart2')
  chartCanvas2!: ElementRef<HTMLCanvasElement>;

  @ViewChild('salesChart3')
  chartCanvas3!: ElementRef<HTMLCanvasElement>;

  chart!: Chart;

  ngAfterViewInit(): void {
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
          {
            label: 'Sales',
            data: [120, 180, 140, 220, 170]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    };

    this.chart = new Chart(
      this.chartCanvas1.nativeElement,
      config
    );

    this.chart = new Chart(
      this.chartCanvas2.nativeElement,
      config
    );

    this.chart = new Chart(
      this.chartCanvas3.nativeElement,
      config
    );
  }
}
