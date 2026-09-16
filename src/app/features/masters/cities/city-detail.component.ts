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
import { CityService } from './city.service';

@Component({
  selector: 'app-city-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './city-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CityDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cityService = inject(CityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

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
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
