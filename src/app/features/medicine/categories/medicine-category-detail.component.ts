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
import { ApiClientError } from '../../../core/models/api-response.types';
import { MedicineCategoryService } from './medicine-category.service';

@Component({
  selector: 'app-medicine-category-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './medicine-category-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineCategoryDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(MedicineCategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isNew.set(false);
      this.entityId = id;
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
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
