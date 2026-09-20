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
import { PARTY_CONTACT_GRID_CONFIG } from './party-contact-grid.config';
import { PartyContact } from './party-contact.models';
import { PartyContactService } from './party-contact.service';

@Component({
  selector: 'app-party-contacts-tab',
  standalone: true,
  imports: [
    AppGridComponent,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
  ],
  templateUrl: './party-contacts-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyContactsTabComponent {
  private readonly fb = inject(FormBuilder);
  private readonly partyContactService = inject(PartyContactService);

  readonly partyId = input.required<string>();

  readonly gridConfig = PARTY_CONTACT_GRID_CONFIG;
  readonly rows = signal<PartyContact[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly search = signal('');
  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly editingVersion = signal('0');
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    contactType: ['MOBILE', Validators.required],
    contactValue: ['', Validators.required],
    countryCode: [''],
    isPrimary: [false],
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

  onGridAction(event: GridActionEvent<PartyContact>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.openEdit(event.row);
    }
    if (event.action === 'delete') {
      this.partyContactService
        .delete(this.partyId(), event.row.id, event.row.version)
        .subscribe({ next: () => this.load() });
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingVersion.set('0');
    this.form.reset({
      contactType: 'MOBILE',
      contactValue: '',
      countryCode: '',
      isPrimary: false,
      isActive: true,
    });
    this.dialogVisible.set(true);
  }

  openEdit(contact: PartyContact): void {
    this.editingId.set(contact.id);
    this.editingVersion.set(contact.version);
    this.form.patchValue({
      contactType: contact.contactType,
      contactValue: contact.contactValue,
      countryCode: contact.countryCode ?? '',
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
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
      this.partyContactService
        .update(partyId, this.editingId()!, {
          version: this.editingVersion(),
          contactType: value.contactType,
          contactValue: value.contactValue,
          countryCode: value.countryCode || undefined,
          isPrimary: value.isPrimary,
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

    this.partyContactService
      .create(partyId, {
        contactType: value.contactType,
        contactValue: value.contactValue,
        countryCode: value.countryCode || undefined,
        isPrimary: value.isPrimary,
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
    this.partyContactService
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
