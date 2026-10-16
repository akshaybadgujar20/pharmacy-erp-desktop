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
import { CustomerService } from '../../features/party/customers/customer.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-customer-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomerLookupComponent),
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
      placeholder="Search customer"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLookupComponent implements ControlValueAccessor {
  private readonly customers = inject(CustomerService);

  readonly disabled = input(false);

  readonly suggestions = signal<LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);

  private valueId: string | null = null;
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.valueId = value;
    if (!value) {
      this.selected.set(null);
      return;
    }
    this.customers.getById(value).subscribe({
      next: (customer) => {
        this.selected.set({
          id: customer.id,
          label: customer.customerCode,
          sublabel: customer.partyId,
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

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  search(query: string): void {
    const q = query.trim();
    this.customers
      .list({ page: '1', pageSize: '20', ...(q ? { search: q } : {}) })
      .subscribe({
        next: ({ data }) => {
          this.suggestions.set(
            data.map((row) => ({
              id: row.id,
              label: row.customerCode,
              sublabel: row.partyId,
            })),
          );
        },
      });
  }

  onSelect(option: LookupOption | null): void {
    this.selected.set(option);
    this.valueId = option?.id ?? null;
    this.onChange(this.valueId);
    this.onTouched();
  }
}
