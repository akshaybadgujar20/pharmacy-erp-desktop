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
import { StateService } from './state.service';

@Component({
  selector: 'app-state-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './state-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stateService = inject(StateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    countryId: ['', Validators.required],
    stateCode: ['', Validators.required],
    stateName: ['', Validators.required],
    gstStateCode: [''],
    isoCode: [''],
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
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
