import {AfterViewInit, Component, ElementRef, inject, ViewChild} from '@angular/core';
import {ColDef} from 'ag-grid-community';
import {AgGridAngular} from 'ag-grid-angular';
import { ToastrService } from 'ngx-toastr';

import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';
import {MatButtonToggle} from '@angular/material/button-toggle';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [
    AgGridAngular,
    MatButtonToggle,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements AfterViewInit {

  toastr = inject(ToastrService);

  showSuccess() {
    this.toastr.success('Hello world!', 'Toastr fun!');
  }

  columnDefs: ColDef[] = [
    { field: 'id' },
    { field: 'name' },
    { field: 'city' }
  ];

  rowData = [
    { id: 1, name: 'John', city: 'London' },
    { id: 2, name: 'Jane', city: 'Manchester' },
    { id: 3, name: 'Alex', city: 'Birmingham' }
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
