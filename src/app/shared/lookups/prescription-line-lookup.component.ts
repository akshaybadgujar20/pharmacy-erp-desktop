import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PrescriptionItemService } from '../../features/prescription/prescriptions/prescription-item.service';
import { LookupOption } from './lookup.types';

function formatPrescriptionLineLabel(line: {
  lineNumber: number;
  medicineName?: string | null;
  medicineId: string;
  remainingQuantity: string;
}): string {
  const name = line.medicineName?.trim() || line.medicineId;
  return `#${line.lineNumber} ${name} (rem ${line.remainingQuantity})`;
}

@Component({
  selector: 'app-prescription-line-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PrescriptionLineLookupComponent),
      multi: true,
    },
  ],
  template: `
    <p-autocomplete
      [ngModel]="selected()"
      (ngModelChange)="onSelect($event)"
      [suggestions]="suggestions()"
      (completeMethod)="search($event.query)"
      (onDropdownClick)="loadLines()"
      optionLabel="label"
      [dropdown]="true"
      [forceSelection]="true"
      [disabled]="lookupDisabled()"
      placeholder="Search prescription line"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrescriptionLineLookupComponent implements ControlValueAccessor {
  private readonly items = inject(PrescriptionItemService);

  readonly prescriptionId = input<string | null>(null);
  readonly disabled = input(false);

  readonly lookupDisabled = computed(() => this.disabled() || !this.prescriptionId());

  readonly suggestions = signal<LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);

  private valueId: string | null = null;
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const rxId = this.prescriptionId();
      if (!rxId || !this.valueId) {
        return;
      }
      this.resolveSelection(rxId, this.valueId);
    });
  }

  writeValue(value: string | null): void {
    this.valueId = value;
    const rxId = this.prescriptionId();
    if (!value) {
      this.selected.set(null);
      return;
    }
    if (!rxId) {
      this.selected.set({ id: value, label: value });
      return;
    }
    this.resolveSelection(rxId, value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  loadLines(query = ''): void {
    const rxId = this.prescriptionId();
    if (!rxId) {
      this.suggestions.set([]);
      return;
    }
    const q = query.trim().toLowerCase();
    this.items.list(rxId, { page: '1', pageSize: '100' }).subscribe({
      next: ({ data }) => {
        const mapped = data.map((row) => ({
          id: row.id,
          label: formatPrescriptionLineLabel(row),
          sublabel: row.medicineId,
        }));
        this.suggestions.set(
          q
            ? mapped.filter(
                (row) =>
                  row.label.toLowerCase().includes(q) ||
                  row.sublabel?.toLowerCase().includes(q),
              )
            : mapped,
        );
      },
    });
  }

  search(query: string): void {
    this.loadLines(query);
  }

  onSelect(option: LookupOption | null): void {
    this.selected.set(option);
    this.valueId = option?.id ?? null;
    this.onChange(this.valueId);
    this.onTouched();
  }

  private resolveSelection(rxId: string, itemId: string): void {
    this.items.getById(rxId, itemId).subscribe({
      next: (row) => {
        this.selected.set({
          id: row.id,
          label: formatPrescriptionLineLabel(row),
          sublabel: row.medicineId,
        });
      },
      error: () => {
        this.selected.set({ id: itemId, label: itemId });
      },
    });
  }
}