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
import { SalesInvoiceService } from '../../features/sales/sales-invoices/sales-invoice.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-sales-invoice-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SalesInvoiceLookupComponent),
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
      placeholder="Search sales invoice"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceLookupComponent implements ControlValueAccessor {
  private readonly invoices = inject(SalesInvoiceService);

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
    this.invoices.getById(value).subscribe({
      next: (invoice) => {
        this.selected.set({
          id: invoice.id,
          label: invoice.invoiceNumber,
          sublabel: invoice.status,
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
    this.invoices
      .list({ page: '1', pageSize: '20', ...(q ? { search: q } : {}) })
      .subscribe({
        next: ({ data }) => {
          this.suggestions.set(
            data.map((row) => ({
              id: row.id,
              label: row.invoiceNumber,
              sublabel: row.status,
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
