import { Component } from '@angular/core';
import {ColDef} from 'ag-grid-community';
import {AgGridAngular} from 'ag-grid-angular';

@Component({
  selector: 'app-dashboard',
  imports: [
    AgGridAngular
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
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
}
