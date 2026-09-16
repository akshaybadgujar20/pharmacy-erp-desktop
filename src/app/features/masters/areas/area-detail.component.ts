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
import { AreaService } from './area.service';

@Component({
  selector: 'app-area-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './area-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly areaService = inject(AreaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  private entityId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    cityId: ['', Validators.required],
    areaCode: ['', Validators.required],
    areaName: ['', Validators.required],
    postalCode: [''],
    deliveryZone: [''],
    routeCode: [''],
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
      this.areaService
        .create({
          cityId: value.cityId,
          areaCode: value.areaCode,
          areaName: value.areaName,
          postalCode: value.postalCode || undefined,
          deliveryZone: value.deliveryZone || undefined,
          routeCode: value.routeCode || undefined,
          latitude: value.latitude ?? undefined,
          longitude: value.longitude ?? undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (area) => {
            this.saving.set(false);
            this.router.navigate(['/masters/areas', area.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.areaService
      .update(this.entityId!, {
        version: this.version(),
        cityId: value.cityId,
        areaCode: value.areaCode,
        areaName: value.areaName,
        postalCode: value.postalCode || undefined,
        deliveryZone: value.deliveryZone || undefined,
        routeCode: value.routeCode || undefined,
        latitude: value.latitude ?? undefined,
        longitude: value.longitude ?? undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (area) => {
          this.version.set(area.version);
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
    this.areaService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/masters/areas']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/masters/areas']);
  }

  private load(id: string): void {
    this.areaService.getById(id).subscribe({
      next: (area) => {
        this.version.set(area.version);
        this.form.patchValue({
          cityId: area.cityId,
          areaCode: area.areaCode,
          areaName: area.areaName,
          postalCode: area.postalCode ?? '',
          deliveryZone: area.deliveryZone ?? '',
          routeCode: area.routeCode ?? '',
          latitude: area.latitude,
          longitude: area.longitude,
          isActive: area.isActive,
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
