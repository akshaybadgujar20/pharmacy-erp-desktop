import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CountryService } from '../countries/country.service';
import { StateService } from './state.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-state-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './state-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly stateService = inject(StateService);
  private readonly countryService = inject(CountryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly countryOptions = signal<{ label: string; value: string }[]>([]);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    countryId: ['', Validators.required],
    stateCode: ['', Validators.required],
    stateName: ['', Validators.required],
    gstStateCode: [''],
    isoCode: [''],
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

    this.loadCountryOptions();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.entityId = id;
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
      this.stateService
        .create({
          countryId: value.countryId,
          stateCode: value.stateCode,
          stateName: value.stateName,
          gstStateCode: value.gstStateCode || undefined,
          isoCode: value.isoCode || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (state) => {
            this.saving.set(false);
            this.router.navigate(['/masters/states', state.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.stateService
      .update(this.entityId!, {
        version: this.version(),
        countryId: value.countryId,
        stateCode: value.stateCode,
        stateName: value.stateName,
        gstStateCode: value.gstStateCode || undefined,
        isoCode: value.isoCode || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (state) => {
          this.version.set(state.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    if (!this.entityId) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.stateService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/masters/states']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/masters/states']);
  }

  private loadCountryOptions(): void {
    this.countryService.list({ page: '1', pageSize: '100' }).subscribe({
      next: (result) => {
        this.countryOptions.set(
          result.data.map((country) => ({
            label: country.countryName,
            value: country.id,
          })),
        );
      },
    });
  }

  private load(id: string): void {
    this.stateService.getById(id).subscribe({
      next: (state) => {
        this.version.set(state.version);
        this.form.patchValue({
          countryId: state.countryId,
          stateCode: state.stateCode,
          stateName: state.stateName,
          gstStateCode: state.gstStateCode ?? '',
          isoCode: state.isoCode ?? '',
          isActive: state.isActive,
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
