import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrescriptionItemService } from '../../prescription/prescriptions/prescription-item.service';
import { SalesPrescriptionLinesPanelComponent } from './sales-prescription-lines-panel.component';

describe('SalesPrescriptionLinesPanelComponent', () => {
  let fixture: ComponentFixture<SalesPrescriptionLinesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesPrescriptionLinesPanelComponent],
      providers: [
        {
          provide: PrescriptionItemService,
          useValue: {
            list: jest.fn().mockReturnValue(
              of({
                data: [
                  {
                    id: '1',
                    medicineId: '10',
                    medicineName: 'Paracetamol',
                    remainingQuantity: '2',
                  },
                ],
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesPrescriptionLinesPanelComponent);
    fixture.componentRef.setInput('prescriptionId', '99');
    fixture.detectChanges();
  });

  it('shows medicine name from API', () => {
    expect(fixture.nativeElement.textContent).toContain('Paracetamol');
  });
});
