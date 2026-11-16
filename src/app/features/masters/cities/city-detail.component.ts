import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { StateService } from '../states/state.service';
import { CityService } from './city.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-city-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './city-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CityDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly cityService = inject(CityService);
  private readonly stateService = inject(StateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly stateOptions = signal<{ label: string; value: string }[]>([]);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    stateId: ['', Validators.required],
    cityCode: ['', Validators.required],
    cityName: ['', Validators.required],
    district: [''],
    postalRegion: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],
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

    this.loadStateOptions();

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
      this.cityService
        .create({
          stateId: value.stateId,
          cityCode: value.cityCode,
          cityName: value.cityName,
          district: value.district || undefined,
          postalRegion: value.postalRegion || undefined,
          latitude: value.latitude ?? undefined,
          longitude: value.longitude ?? undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (city) => {
            this.saving.set(false);
            this.router.navigate(['/masters/cities', city.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.cityService
      .update(this.entityId!, {
        version: this.version(),
        stateId: value.stateId,
        cityCode: value.cityCode,
        cityName: value.cityName,
        district: value.district || undefined,
        postalRegion: value.postalRegion || undefined,
        latitude: value.latitude ?? undefined,
        longitude: value.longitude ?? undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (city) => {
          this.version.set(city.version);
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
    this.cityService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/masters/cities']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/masters/cities']);
  }

  private loadStateOptions(): void {
    this.stateService.list({ page: '1', pageSize: '100' }).subscribe({
      next: (result) => {
        this.stateOptions.set(
          result.data.map((state) => ({
            label: state.stateName,
            value: state.id,
          })),
        );
      },
    });
  }

  private load(id: string): void {
    this.cityService.getById(id).subscribe({
      next: (city) => {
        this.version.set(city.version);
        this.form.patchValue({
          stateId: city.stateId,
          cityCode: city.cityCode,
          cityName: city.cityName,
          district: city.district ?? '',
          postalRegion: city.postalRegion ?? '',
          latitude: city.latitude,
          longitude: city.longitude,
          isActive: city.isActive,
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
