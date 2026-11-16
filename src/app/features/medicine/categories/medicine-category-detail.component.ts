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
import { TextareaModule } from 'primeng/textarea';
import { MedicineCategoryService } from './medicine-category.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenPrintService } from '../../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../../shared/keyboard';
@Component({
  selector: 'app-medicine-category-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    ButtonModule,
    CheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './medicine-category-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineCategoryDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(MedicineCategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly parentCategoryOptions = signal<{ label: string; value: string }[]>([]);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    parentCategoryId: [''],
    categoryCode: ['', Validators.required],
    categoryName: ['', Validators.required],
    description: [''],
    displayOrder: [0],
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

    this.loadParentCategoryOptions();

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
      this.categoryService
        .create({
          parentCategoryId: value.parentCategoryId || undefined,
          categoryCode: value.categoryCode,
          categoryName: value.categoryName,
          description: value.description || undefined,
          displayOrder: value.displayOrder,
          isActive: value.isActive,
        })
        .subscribe({
          next: (category) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/categories', category.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.categoryService
      .update(this.entityId!, {
        version: this.version(),
        parentCategoryId: value.parentCategoryId || null,
        categoryCode: value.categoryCode,
        categoryName: value.categoryName,
        description: value.description || undefined,
        displayOrder: value.displayOrder,
        isActive: value.isActive,
      })
      .subscribe({
        next: (category) => {
          this.version.set(category.version);
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
    this.categoryService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/categories']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/categories']);
  }

  private loadParentCategoryOptions(): void {
    this.categoryService.list({ page: '1', pageSize: '100' }).subscribe({
      next: (result) => {
        this.parentCategoryOptions.set(
          result.data.map((category) => ({
            label: category.categoryName,
            value: category.id,
          })),
        );
      },
    });
  }

  private load(id: string): void {
    this.categoryService.getById(id).subscribe({
      next: (category) => {
        this.version.set(category.version);
        this.form.patchValue({
          parentCategoryId: category.parentCategoryId ?? '',
          categoryCode: category.categoryCode,
          categoryName: category.categoryName,
          description: category.description ?? '',
          displayOrder: category.displayOrder,
          isActive: category.isActive,
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
