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
import { SequenceGeneratorService } from './sequence-generator.service';

@Component({
  selector: 'app-sequence-generator-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './sequence-generator-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SequenceGeneratorDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly sequenceGeneratorService = inject(SequenceGeneratorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    branchId: [''],
    documentType: ['', Validators.required],
    prefix: [''],
    suffix: [''],
    currentNumber: ['0', Validators.required],
    incrementBy: [1],
    paddingLength: [6],
    resetPolicy: ['NEVER', Validators.required],
    format: [''],
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
      this.sequenceGeneratorService
        .create({
          branchId: value.branchId || undefined,
          documentType: value.documentType,
          prefix: value.prefix || undefined,
          suffix: value.suffix || undefined,
          currentNumber: value.currentNumber,
          incrementBy: value.incrementBy,
          paddingLength: value.paddingLength,
          resetPolicy: value.resetPolicy,
          format: value.format || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (sequenceGenerator) => {
            this.saving.set(false);
            this.router.navigate(['/configuration/sequence-generators', sequenceGenerator.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.sequenceGeneratorService
      .update(this.entityId!, {
        version: this.version(),
        branchId: value.branchId || undefined,
        documentType: value.documentType,
        prefix: value.prefix || undefined,
        suffix: value.suffix || undefined,
        currentNumber: value.currentNumber,
        incrementBy: value.incrementBy,
        paddingLength: value.paddingLength,
        resetPolicy: value.resetPolicy,
        format: value.format || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (sequenceGenerator) => {
          this.version.set(sequenceGenerator.version);
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
    this.sequenceGeneratorService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/configuration/sequence-generators']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/sequence-generators']);
  }

  private load(id: string): void {
    this.sequenceGeneratorService.getById(id).subscribe({
      next: (sequenceGenerator) => {
        this.version.set(sequenceGenerator.version);
        this.form.patchValue({
          branchId: sequenceGenerator.branchId ?? '',
          documentType: sequenceGenerator.documentType,
          prefix: sequenceGenerator.prefix ?? '',
          suffix: sequenceGenerator.suffix ?? '',
          currentNumber: sequenceGenerator.currentNumber,
          incrementBy: sequenceGenerator.incrementBy,
          paddingLength: sequenceGenerator.paddingLength,
          resetPolicy: sequenceGenerator.resetPolicy,
          format: sequenceGenerator.format ?? '',
          isActive: sequenceGenerator.isActive,
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
