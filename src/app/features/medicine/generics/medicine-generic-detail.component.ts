import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { resolveApiErrorMessage } from '../../../core/utils/api-error-message.util';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MedicineGenericService } from './medicine-generic.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-medicine-generic-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './medicine-generic-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineGenericDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly genericService = inject(MedicineGenericService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    genericCode: ['', Validators.required],
    genericName: ['', Validators.required],
    therapeuticClass: [''],
    pharmacologicalClass: [''],
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
      this.genericService
        .create({
          genericCode: value.genericCode,
          genericName: value.genericName,
          therapeuticClass: value.therapeuticClass || undefined,
          pharmacologicalClass: value.pharmacologicalClass || undefined,
          description: value.description || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (generic) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/generics', generic.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.genericService
      .update(this.entityId!, {
        version: this.version(),
        genericCode: value.genericCode,
        genericName: value.genericName,
        therapeuticClass: value.therapeuticClass || undefined,
        pharmacologicalClass: value.pharmacologicalClass || undefined,
        description: value.description || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (generic) => {
          this.version.set(generic.version);
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
    this.genericService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/generics']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/generics']);
  }

  private load(id: string): void {
    this.genericService.getById(id).subscribe({
      next: (generic) => {
        this.version.set(generic.version);
        this.form.patchValue({
          genericCode: generic.genericCode,
          genericName: generic.genericName,
          therapeuticClass: generic.therapeuticClass ?? '',
          pharmacologicalClass: generic.pharmacologicalClass ?? '',
          description: generic.description ?? '',
          isActive: generic.isActive,
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
