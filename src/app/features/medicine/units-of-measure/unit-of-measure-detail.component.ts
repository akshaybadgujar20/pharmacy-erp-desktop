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
import { UNIT_TYPES } from './unit-of-measure.models';
import { UnitOfMeasureService } from './unit-of-measure.service';

@Component({
  selector: 'app-unit-of-measure-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './unit-of-measure-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitOfMeasureDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly unitOfMeasureService = inject(UnitOfMeasureService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly unitTypes = UNIT_TYPES;
  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    unitCode: ['', Validators.required],
    unitName: ['', Validators.required],
    shortName: ['', Validators.required],
    unitType: ['COUNT', Validators.required],
    decimalAllowed: [false],
    description: [''],
    isSystemUnit: [false],
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
      this.unitOfMeasureService
        .create({
          unitCode: value.unitCode,
          unitName: value.unitName,
          shortName: value.shortName,
          unitType: value.unitType,
          decimalAllowed: value.decimalAllowed,
          description: value.description || undefined,
          isSystemUnit: value.isSystemUnit,
          isActive: value.isActive,
        })
        .subscribe({
          next: (unit) => {
            this.saving.set(false);
            this.router.navigate(['/medicine/units-of-measure', unit.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.unitOfMeasureService
      .update(this.entityId!, {
        version: this.version(),
        unitCode: value.unitCode,
        unitName: value.unitName,
        shortName: value.shortName,
        unitType: value.unitType,
        decimalAllowed: value.decimalAllowed,
        description: value.description || undefined,
        isSystemUnit: value.isSystemUnit,
        isActive: value.isActive,
      })
      .subscribe({
        next: (unit) => {
          this.version.set(unit.version);
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
    this.unitOfMeasureService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/medicine/units-of-measure']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/medicine/units-of-measure']);
  }

  private load(id: string): void {
    this.unitOfMeasureService.getById(id).subscribe({
      next: (unit) => {
        this.version.set(unit.version);
        this.form.patchValue({
          unitCode: unit.unitCode,
          unitName: unit.unitName,
          shortName: unit.shortName,
          unitType: unit.unitType,
          decimalAllowed: unit.decimalAllowed,
          description: unit.description ?? '',
          isSystemUnit: unit.isSystemUnit,
          isActive: unit.isActive,
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
