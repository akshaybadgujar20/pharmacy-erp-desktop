import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PrescriptionItem } from '../../prescription/prescriptions/prescription-item.models';
import { PrescriptionItemService } from '../../prescription/prescriptions/prescription-item.service';

export interface PrescriptionLineAddEvent {
  medicineId: string;
  soldQuantity: number;
}

@Component({
  selector: 'app-sales-prescription-lines-panel',
  standalone: true,
  imports: [ButtonModule],
  template: `
    @if (lines().length > 0) {
      <section>
        <h3>Prescription lines</h3>
        <ul>
          @for (line of lines(); track line.id) {
            <li>
              Medicine {{ line.medicineId }} — remaining {{ line.remainingQuantity }}
              <button
                pButton
                type="button"
                label="Add to invoice"
                (click)="add.emit({ medicineId: line.medicineId, soldQuantity: remainingQty(line) })"
              ></button>
            </li>
          }
        </ul>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesPrescriptionLinesPanelComponent implements OnInit {
  private readonly prescriptionItems = inject(PrescriptionItemService);

  readonly prescriptionId = input.required<string>();
  readonly add = output<PrescriptionLineAddEvent>();

  readonly lines = signal<PrescriptionItem[]>([]);

  ngOnInit(): void {
    this.load(this.prescriptionId());
  }

  remainingQty(line: PrescriptionItem): number {
    const value = Number(line.remainingQuantity);
    return value > 0 ? value : 1;
  }

  private load(prescriptionId: string): void {
    if (!prescriptionId) {
      this.lines.set([]);
      return;
    }
    this.prescriptionItems.list(prescriptionId, { page: '1', pageSize: '50' }).subscribe({
      next: ({ data }) => this.lines.set(data),
    });
  }
}
