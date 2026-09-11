import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { take } from 'rxjs';
import { KeyboardShortcutService } from '../../core/keyboard';
import { ToolbarActionEvent } from '../generic/toolbar/types/toolbar-events.types';
import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';
import { AppGridComponent } from '../generic/grid';
import { AppToolbarComponent } from '../generic/toolbar';
import {
  AppDialogComponent,
  AppDialogService,
  AppDrawerComponent,
  DialogConfig,
  DrawerConfig,
} from '../generic/dialog';
import { GridConfig } from '../generic/grid/types/grid.types';
import { ToolbarConfig } from '../generic/toolbar/types/toolbar.types';
import { DynamicDialogDemoComponent } from './dynamic-dialog-demo.component';

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
    AppDialogComponent,
    AppDrawerComponent,
    ButtonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly appDialogService = inject(AppDialogService);

  readonly dialogVisible = signal(false);
  readonly drawerVisible = signal(false);
  readonly dialogResult = signal<string>('');

  readonly dialogConfig: DialogConfig = {
    header: 'Demo Dialog',
    width: '28rem',
    footer: {
      buttons: [
        { id: 'cancel', label: 'Cancel', severity: 'secondary', variant: 'outlined' },
        { id: 'save', label: 'Save' },
      ],
    },
  };

  readonly drawerConfig: DrawerConfig = {
    header: 'Demo Drawer',
    position: 'right',
    styleClass: 'w-96',
    footer: {
      buttons: [{ id: 'close', label: 'Close', severity: 'secondary' }],
    },
  };

  readonly toolbarConfig: ToolbarConfig = {
    id: 'dashboard-toolbar',
    layout: { direction: 'horizontal', align: 'between' },
    items: [
      {
        type: 'button',
        id: 'refresh',
        label: 'Refresh',
        icon: 'pi pi-refresh',
        variant: 'outlined',
        shortcutId: 'global.refresh',
      },
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

  ngOnInit(): void {
    this.shortcuts.registerHandler('global.refresh', () => this.onRefresh());
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'refresh') {
      this.onRefresh();
    }
  }

  onRefresh(): void {
    console.info('Dashboard refresh triggered');
  }

  onConfirmDemo(): void {
    this.appDialogService
      .confirm({ message: 'Save dashboard changes?', preset: 'info' })
      .pipe(take(1))
      .subscribe((accepted) => {
        this.dialogResult.set(accepted ? 'Confirmed save' : 'Cancelled save');
      });
  }

  onConfirmDeleteDemo(): void {
    this.appDialogService
      .confirmDelete('Delete this demo record?')
      .pipe(take(1))
      .subscribe((accepted) => {
        this.dialogResult.set(accepted ? 'Confirmed delete' : 'Cancelled delete');
      });
  }

  onConfirmPopupDemo(event: Event): void {
    this.appDialogService
      .confirmPopup({ message: 'Proceed with popup confirm?' }, event.currentTarget as EventTarget)
      .pipe(take(1))
      .subscribe((accepted) => {
        this.dialogResult.set(accepted ? 'Popup confirmed' : 'Popup cancelled');
      });
  }

  onOpenDynamicDemo(): void {
    const ref = this.appDialogService.openDynamic(DynamicDialogDemoComponent, {
      header: 'Dynamic Dialog Demo',
      width: '24rem',
    });
    ref.onClose.pipe(take(1)).subscribe((value) => {
      this.dialogResult.set(value ? `Dynamic: ${value}` : 'Dynamic: closed');
    });
  }

  onDialogFooter(buttonId: string): void {
    if (buttonId === 'save') {
      this.dialogResult.set('Dialog save clicked');
    }
    this.dialogVisible.set(false);
  }

  onDrawerFooter(buttonId: string): void {
    if (buttonId === 'close') {
      this.drawerVisible.set(false);
    }
  }

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
