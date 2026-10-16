import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Medicine } from '../../../features/medicine/medicines/medicine.models';
import { MedicineService } from '../../../features/medicine/medicines/medicine.service';

@Component({
  selector: 'app-medicine-search-dialog',
  standalone: true,
  imports: [DialogModule, InputTextModule, ButtonModule, FormsModule],
  template: `
    <p-dialog
      header="Medicine search (F4)"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [style]="{ width: '28rem' }"
    >
      <input pInputText [(ngModel)]="query" (keyup.enter)="search()" placeholder="Search medicines" />
      <button pButton type="button" label="Search" (click)="search()"></button>
      <ul>
        @for (row of results(); track row.id) {
          <li>
            <button type="button" (click)="pick(row)">{{ row.medicineName }} ({{ row.medicineCode }})</button>
          </li>
        }
      </ul>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineSearchDialogComponent {
  private readonly medicines = inject(MedicineService);
  private readonly router = inject(Router);

  readonly selected = output<Medicine>();

  readonly visible = signal(false);
  readonly results = signal<Medicine[]>([]);
  query = '';

  open(): void {
    this.visible.set(true);
    this.results.set([]);
    this.query = '';
  }

  search(): void {
    const search = this.query.trim();
    if (!search) {
      return;
    }
    this.medicines.list({ page: '1', pageSize: '20', search }).subscribe({
      next: ({ data }) => this.results.set(data),
    });
  }

  pick(row: Medicine): void {
    this.selected.emit(row);
    this.visible.set(false);
    this.router.navigate(['/medicine/medicines', row.id]);
  }
}
