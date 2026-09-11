import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AppGridComponent } from '../../../components/generic/grid';
import { GridActionEvent, GridFilterChange, GridPageChange } from '../../../components/generic/grid/types/grid-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { PARTY_ADDRESS_GRID_CONFIG } from './party-address-grid.config';
import { PartyAddress } from './party-address.models';
import { PartyAddressService } from './party-address.service';

@Component({
  selector: 'app-party-addresses-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './party-addresses-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyAddressesTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly partyAddressService = inject(PartyAddressService);

  readonly partyId = input.required<string>();

  readonly gridConfig = PARTY_ADDRESS_GRID_CONFIG;
  readonly rows = signal<PartyAddress[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal(0);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    addressType: ['HOME', Validators.required],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    postalCode: [''],
    isDefault: [false],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const id = this.partyId();
      if (id) {
        this.load();
      }
    });
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  onGridAction(event: GridActionEvent<PartyAddress>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.partyAddressService
        .delete(this.partyId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set(0);
    this.form.reset({
      addressType: 'HOME',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      isDefault: false,
      isActive: true,
    });
    this.dialogVisible.set(true);
  }

  openEdit(address: PartyAddress): void {
    this.editingId.set(address.id);
    this.editingVersion.set(address.version);
    this.form.patchValue({
      addressType: address.addressType,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      postalCode: address.postalCode ?? '',
      isDefault: address.isDefault,
      isActive: address.isActive,
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const partyId = this.partyId();

    if (this.editingId()) {
      this.partyAddressService
        .update(partyId, this.editingId()!, {
          version: this.editingVersion(),
          addressType: value.addressType,
          addressLine1: value.addressLine1,
          addressLine2: value.addressLine2 || undefined,
          postalCode: value.postalCode || undefined,
          isDefault: value.isDefault,
          isActive: value.isActive,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.closeDialog();
            this.load();
          },
          error: () => this.saving.set(false),
        });
      return;
    }

    this.partyAddressService
      .create(partyId, {
        addressType: value.addressType,
        addressLine1: value.addressLine1,
        addressLine2: value.addressLine2 || undefined,
        postalCode: value.postalCode || undefined,
        isDefault: value.isDefault,
        isActive: value.isActive,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.closeDialog();
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.partyAddressService
      .list(this.partyId(), toListParams(this.page(), this.pageSize(), this.search()))
      .subscribe({
        next: (result) => {
          this.rows.set(result.data);
          this.totalRecords.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
