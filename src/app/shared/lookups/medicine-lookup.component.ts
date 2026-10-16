import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MedicineService } from '../../features/medicine/medicines/medicine.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-medicine-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MedicineLookupComponent),
      multi: true,
    },
  ],
  template: `
    <p-autocomplete
      [ngModel]="selected()"
      (ngModelChange)="onSelect($event)"
      [suggestions]="suggestions()"
      (completeMethod)="search($event.query)"
      optionLabel="label"
      [dropdown]="true"
      [forceSelection]="true"
      [disabled]="disabled()"
      placeholder="Search medicine"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineLookupComponent implements ControlValueAccessor {
  private readonly medicines = inject(MedicineService);

  readonly disabled = input(false);

  readonly suggestions = signal<LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    if (!value) {
      this.selected.set(null);
      return;
    }
    this.medicines.getById(value).subscribe({
      next: (medicine) => {
        this.selected.set({
          id: medicine.id,
          label: medicine.medicineName,
          sublabel: medicine.medicineCode,
        });
      },
    });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    return;
  }

  search(query: string): void {
    const q = query.trim();
    this.medicines
      .list({ page: '1', pageSize: '20', ...(q ? { search: q } : {}) })
      .subscribe({
        next: ({ data }) => {
          this.suggestions.set(
            data.map((row) => ({
              id: row.id,
              label: row.medicineName,
              sublabel: row.medicineCode,
            })),
          );
        },
      });
  }

  onSelect(option: LookupOption | null): void {
    this.selected.set(option);
    this.onChange(option?.id ?? null);
    this.onTouched();
  }
}
