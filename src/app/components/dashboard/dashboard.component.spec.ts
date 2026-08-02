// dashboard.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AgGridAngular } from 'ag-grid-angular';
import { MatButtonToggle } from '@angular/material/button-toggle';
import * as ChartJS from 'chart.js';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let toastrService: ToastrService;

  beforeEach(async () => {
    // Spy on the Chart constructor to verify it is called without executing actual chart logic
    // jest.spyOn(ChartJS.Chart, 'constructor');

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent, // Import the standalone component
        ToastrModule.forRoot(),
        AgGridAngular,
        MatButtonToggle,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    toastrService = TestBed.inject(ToastrService);

    // Run change detection to trigger ngAfterViewInit and chart initialization
    fixture.detectChanges();
  });

  it('should create the dashboard component', () => {
    expect(component).toBeTruthy();
  });

  describe('Data properties', () => {
    it('should have columnDefs defined with correct fields', () => {
      expect(component.columnDefs).toBeDefined();
      expect(component.columnDefs.length).toBe(3);
      expect(component.columnDefs[0].field).toBe('id');
      expect(component.columnDefs[2].field).toBe('city');
    });

    it('should have initial rowData set', () => {
      expect(component.rowData).toBeDefined();
      expect(component.rowData.length).toBe(3);

      expect(component.rowData[0]).toEqual({ id: 1, name: 'John', city: 'London' });
      expect(component.rowData[1]).toEqual({ id: 2, name: 'Jane', city: 'Manchester' });
      expect(component.rowData[2]).toEqual({ id: 3, name: 'Alex', city: 'Birmingham' });
    });
  });

  describe('Methods', () => {
    it('should call toastr.success when showSuccess is called', () => {
      const successSpy = jest.spyOn(toastrService, 'success');

      component.showSuccess();

      expect(successSpy).toHaveBeenCalledWith('Hello world!', 'Toastr fun!');
    });
  });

  /*describe('ngAfterViewInit behavior', () => {
    it('should initialize charts (call Chart constructor)', () => {
      // The source code creates three chart instances for salesChart1, salesChart2, and salesChart3
      expect(ChartJS.Chart).toHaveBeenCalledTimes(3);
    });

    it('should use the correct bar configuration type', () => {
      // Verify that the Chart was instantiated with a configuration containing 'type: "bar"'
      const calls = ChartJS.Chart.mock.calls;

      // Check if any call has the config object passed as the second argument
      calls.forEach((call) => {
        const config = call[1];
        expect(config.type).toBe('bar');
        expect(config.data.datasets.length).toBe(1);
        expect(config.data.datasets[0].label).toBe('Sales');
      });
    });
  });*/
});
