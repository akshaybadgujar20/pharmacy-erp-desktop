import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MedicineGenericService } from '../generics/medicine-generic.service';
import { UnitOfMeasureService } from '../units-of-measure/unit-of-measure.service';
import { SaltCompositionService } from './salt-composition.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-salt-composition-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './salt-composition-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaltCompositionDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly saltCompositionService = inject(SaltCompositionService);
  private readonly genericService = inject(MedicineGenericService);
  private readonly unitOfMeasureService = inject(UnitOfMeasureService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly genericOptions = signal<{ label: string; value: string }[]>([]);
  readonly unitOptions = signal<{ label: string; value: string }[]>([]);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    genericId: ['', Validators.required],
    unitId: ['', Validators.required],
    compositionCode: ['', Validators.required],
    strength: ['', Validators.required],
    strengthUnit: ['', Validators.required],
    description: [''],
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

    this.loadLookupOptions();

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
      this.saltCompositionService
        .create({
          genericId: value.genericId,
          unitId: value.unitId,
          compositionCode: value.compositionCode,
          strength: value.strength,
          strengthUnit: value.strengthUnit,
          description: value.description || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (composition) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/salt-compositions', composition.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.saltCompositionService
      .update(this.entityId!, {
        version: this.version(),
        genericId: value.genericId,
        unitId: value.unitId,
        compositionCode: value.compositionCode,
        strength: value.strength,
        strengthUnit: value.strengthUnit,
        description: value.description || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (composition) => {
          this.version.set(composition.version);
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
    this.saltCompositionService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/salt-compositions']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/salt-compositions']);
  }

  private loadLookupOptions(): void {
    this.genericService.list({ page: '1', pageSize: '100' }).subscribe({
      next: (result) => {
        this.genericOptions.set(
          result.data.map((generic) => ({
            label: generic.genericName,
            value: generic.id,
          })),
        );
      },
    });
    this.unitOfMeasureService.list({ page: '1', pageSize: '100' }).subscribe({
      next: (result) => {
        this.unitOptions.set(
          result.data.map((unit) => ({
            label: unit.unitName,
            value: unit.id,
          })),
        );
      },
    });
  }

  private load(id: string): void {
    this.saltCompositionService.getById(id).subscribe({
      next: (composition) => {
        this.version.set(composition.version);
        this.form.patchValue({
          genericId: composition.genericId,
          unitId: composition.unitId,
          compositionCode: composition.compositionCode,
          strength: composition.strength,
          strengthUnit: composition.strengthUnit,
          description: composition.description ?? '',
          isActive: composition.isActive,
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
