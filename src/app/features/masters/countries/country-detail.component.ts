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
import { CountryService } from './country.service';

@Component({
  selector: 'app-country-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './country-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly countryService = inject(CountryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    countryCode: ['', Validators.required],
    isoAlpha2: ['', Validators.required],
    isoAlpha3: ['', Validators.required],
    countryName: ['', Validators.required],
    nationality: [''],
    phoneCode: [''],
    currencyCode: [''],
    timezone: [''],
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
      this.countryService
        .create({
          countryCode: value.countryCode,
          isoAlpha2: value.isoAlpha2,
          isoAlpha3: value.isoAlpha3,
          countryName: value.countryName,
          nationality: value.nationality || undefined,
          phoneCode: value.phoneCode || undefined,
          currencyCode: value.currencyCode || undefined,
          timezone: value.timezone || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (country) => {
            this.saving.set(false);
            this.router.navigate(['/masters/countries', country.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.countryService
      .update(this.entityId!, {
        version: this.version(),
        countryCode: value.countryCode,
        isoAlpha2: value.isoAlpha2,
        isoAlpha3: value.isoAlpha3,
        countryName: value.countryName,
        nationality: value.nationality || undefined,
        phoneCode: value.phoneCode || undefined,
        currencyCode: value.currencyCode || undefined,
        timezone: value.timezone || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (country) => {
          this.version.set(country.version);
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
    this.countryService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/masters/countries']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/masters/countries']);
  }

  private load(id: string): void {
    this.countryService.getById(id).subscribe({
      next: (country) => {
        this.version.set(country.version);
        this.form.patchValue({
          countryCode: country.countryCode,
          isoAlpha2: country.isoAlpha2,
          isoAlpha3: country.isoAlpha3,
          countryName: country.countryName,
          nationality: country.nationality ?? '',
          phoneCode: country.phoneCode ?? '',
          currencyCode: country.currencyCode ?? '',
          timezone: country.timezone ?? '',
          isActive: country.isActive,
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
