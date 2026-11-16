import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { PartyAddressesTabComponent } from './party-addresses-tab.component';
import { PartyContactsTabComponent } from './party-contacts-tab.component';
import { PartyRolesTabComponent } from './party-roles-tab.component';
import { PARTY_TYPE_OPTIONS } from './party.models';
import { PartyService } from './party.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-party-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
    TabsModule,
    PartyRolesTabComponent,
    PartyAddressesTabComponent,
    PartyContactsTabComponent,
  ],
  templateUrl: './party-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly partyService = inject(PartyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly partyTypeOptions = PARTY_TYPE_OPTIONS;
  readonly isNew = signal(true);
  readonly partyId = signal<string | null>(null);
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly form = this.fb.nonNullable.group({
    partyType: ['PERSON', Validators.required],
    displayName: ['', Validators.required],
    firstName: [''],
    middleName: [''],
    lastName: [''],
    organizationName: [''],
    isActive: [true],
  });

  ngOnDestroy(): void {
    this.detailShortcutBinding?.unregister();
  }

  ngOnInit(): void {
    this.detailShortcutBinding = bindDetailScreenShortcuts(
      this.shortcuts,
      this.activeSave,
      this.activePrint,
      {
        save: () => this.save(),
        delete: () => this.deleteRecord(),
        cancel: () => this.goBack(),
      },
    );

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.partyId.set(id);
      this.load(id);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.partyService
        .create({
          partyType: value.partyType,
          displayName: value.displayName,
          firstName: value.firstName || undefined,
          middleName: value.middleName || undefined,
          lastName: value.lastName || undefined,
          organizationName: value.organizationName || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (party) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.partyId.set(party.id);
            this.version.set(party.version);
            this.router.navigate(['/party/parties', party.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.partyService
      .update(this.partyId()!, {
        version: this.version(),
        partyType: value.partyType,
        displayName: value.displayName,
        firstName: value.firstName || undefined,
        middleName: value.middleName || undefined,
        lastName: value.lastName || undefined,
        organizationName: value.organizationName || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (party) => {
          this.version.set(party.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    const id = this.partyId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.partyService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/party/parties']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/party/parties']);
  }

  private load(id: string): void {
    this.partyService.getById(id).subscribe({
      next: (party) => {
        this.version.set(party.version);
        this.form.patchValue({
          partyType: party.partyType,
          displayName: party.displayName,
          firstName: party.firstName ?? '',
          middleName: party.middleName ?? '',
          lastName: party.lastName ?? '',
          organizationName: party.organizationName ?? '',
          isActive: party.isActive,
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(resolveApiErrorMessage(error));
  }
}
