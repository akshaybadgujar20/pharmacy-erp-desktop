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
import { SaltCompositionService } from './salt-composition.service';

@Component({
  selector: 'app-salt-composition-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './salt-composition-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaltCompositionDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly saltCompositionService = inject(SaltCompositionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

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
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
