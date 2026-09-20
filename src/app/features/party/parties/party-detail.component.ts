import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { PartyAddressesTabComponent } from './party-addresses-tab.component';
import { PartyContactsTabComponent } from './party-contacts-tab.component';
import { PartyRolesTabComponent } from './party-roles-tab.component';
import { PartyService } from './party.service';

@Component({
  selector: 'app-party-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    PartyRolesTabComponent,
    PartyAddressesTabComponent,
    PartyContactsTabComponent,
  ],
  templateUrl: './party-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartyDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly partyService = inject(PartyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.partyId.set(id);
      this.load(id);
    }
  }

  save(): void {
    if (this.form.invalid) {
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
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
