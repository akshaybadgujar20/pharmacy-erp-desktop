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
import { BarcodeConfigurationService } from './barcode-configuration.service';

@Component({
  selector: 'app-barcode-configuration-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './barcode-configuration-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeConfigurationDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly barcodeConfigurationService = inject(BarcodeConfigurationService);
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
    configurationName: ['', Validators.required],
    barcodeType: ['', Validators.required],
    appliesTo: ['', Validators.required],
    labelWidth: ['', Validators.required],
    labelHeight: ['', Validators.required],
    dpi: [203],
    showHumanReadableText: [true],
    template: [''],
    isDefault: [false],
    isActive: [true],
    remarks: [''],
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
      this.barcodeConfigurationService
        .create({
          branchId: value.branchId || undefined,
          configurationName: value.configurationName,
          barcodeType: value.barcodeType,
          appliesTo: value.appliesTo,
          labelWidth: value.labelWidth,
          labelHeight: value.labelHeight,
          dpi: value.dpi,
          showHumanReadableText: value.showHumanReadableText,
          template: value.template || undefined,
          isDefault: value.isDefault,
          isActive: value.isActive,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (barcodeConfiguration) => {
            this.saving.set(false);
            this.router.navigate(['/configuration/barcode-configurations', barcodeConfiguration.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.barcodeConfigurationService
      .update(this.entityId!, {
        version: this.version(),
        branchId: value.branchId || undefined,
        configurationName: value.configurationName,
        barcodeType: value.barcodeType,
        appliesTo: value.appliesTo,
        labelWidth: value.labelWidth,
        labelHeight: value.labelHeight,
        dpi: value.dpi,
        showHumanReadableText: value.showHumanReadableText,
        template: value.template || undefined,
        isDefault: value.isDefault,
        isActive: value.isActive,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (barcodeConfiguration) => {
          this.version.set(barcodeConfiguration.version);
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
    this.barcodeConfigurationService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/configuration/barcode-configurations']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/barcode-configurations']);
  }

  private load(id: string): void {
    this.barcodeConfigurationService.getById(id).subscribe({
      next: (barcodeConfiguration) => {
        this.version.set(barcodeConfiguration.version);
        this.form.patchValue({
          branchId: barcodeConfiguration.branchId ?? '',
          configurationName: barcodeConfiguration.configurationName,
          barcodeType: barcodeConfiguration.barcodeType,
          appliesTo: barcodeConfiguration.appliesTo,
          labelWidth: barcodeConfiguration.labelWidth,
          labelHeight: barcodeConfiguration.labelHeight,
          dpi: barcodeConfiguration.dpi,
          showHumanReadableText: barcodeConfiguration.showHumanReadableText,
          template: barcodeConfiguration.template ?? '',
          isDefault: barcodeConfiguration.isDefault,
          isActive: barcodeConfiguration.isActive,
          remarks: barcodeConfiguration.remarks ?? '',
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
