import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { PrescriptionItemService } from '../../features/prescription/prescriptions/prescription-item.service';
import { PrescriptionLineLookupComponent } from './prescription-line-lookup.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PrescriptionLineLookupComponent],
  template: `
  <app-prescription-line-lookup [prescriptionId]="'rx-1'" [formControl]="control" />`,
})
class HostComponent {
  readonly control = new FormControl<string | null>(null);
}

describe('PrescriptionLineLookupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        {
          provide: PrescriptionItemService,
          useValue: {
            list: jest.fn(() =>
              of({
                data: [
                  {
                    id: 'line-1',
                    lineNumber: 1,
                    medicineId: 'med-1',
                    medicineName: 'Paracetamol',
                    remainingQuantity: '10',
                  },
                ],
                pagination: { total: 1, page: 1, pageSize: 100 },
              }),
            ),
            getById: jest.fn(() =>
              of({
                id: 'line-1',
                lineNumber: 1,
                medicineId: 'med-1',
                medicineName: 'Paracetamol',
                remainingQuantity: '10',
              }),
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('creates lookup bound to prescription id', () => {
    expect(fixture.nativeElement.querySelector('p-autocomplete')).toBeTruthy();
  });
});