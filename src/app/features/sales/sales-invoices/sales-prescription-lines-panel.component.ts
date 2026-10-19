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
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { PrescriptionItem } from '../../prescription/prescriptions/prescription-item.models';
import { PrescriptionItemService } from '../../prescription/prescriptions/prescription-item.service';

export interface PrescriptionLineAddEvent {
  medicineId: string;
  soldQuantity: number;
}

@Component({
  selector: 'app-sales-prescription-lines-panel',
  standalone: true,
  imports: [ButtonModule, InputNumberModule, FormsModule],
  template: `
    @if (lines().length > 0) {
      <section class="rx-lines">
        <h3>Prescription lines</h3>
        <ul>
          @for (line of lines(); track line.id) {
            <li>
              <strong>{{ displayName(line) }}</strong>
              — remaining {{ line.remainingQuantity }}
              <p-inputnumber
                [ngModel]="lineQty(line)"
                (ngModelChange)="setLineQty(line.id, $event)"
                [min]="1"
                [max]="maxQty(line)"
              />
              <button
                pButton
                type="button"
                label="Add to invoice"
                [disabled]="lineQty(line) > maxQty(line)"
                (click)="emitAdd(line)"
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
  private readonly qtyByLineId = signal<Record<string, number>>({});

  ngOnInit(): void {
    this.load(this.prescriptionId());
  }

  displayName(line: PrescriptionItem): string {
    return line.medicineName?.trim() || `Medicine ${line.medicineId}`;
  }

  maxQty(line: PrescriptionItem): number {
    const value = Number(line.remainingQuantity);
    return value > 0 ? value : 0;
  }

  lineQty(line: PrescriptionItem): number {
    const override = this.qtyByLineId()[line.id];
    if (override != null) {
      return override;
    }
    const max = this.maxQty(line);
    return max > 0 ? max : 1;
  }

  setLineQty(lineId: string, value: number | null): void {
    if (value == null) {
      return;
    }
    this.qtyByLineId.update((current) => ({ ...current, [lineId]: value }));
  }

  emitAdd(line: PrescriptionItem): void {
    const soldQuantity = this.lineQty(line);
    if (soldQuantity > this.maxQty(line)) {
      return;
    }
    this.add.emit({ medicineId: line.medicineId, soldQuantity });
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
