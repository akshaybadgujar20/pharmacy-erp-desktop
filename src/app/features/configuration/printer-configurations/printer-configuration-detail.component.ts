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
import { PrinterConfigurationService } from './printer-configuration.service';

@Component({
  selector: 'app-printer-configuration-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './printer-configuration-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrinterConfigurationDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly printerConfigurationService = inject(PrinterConfigurationService);
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
    printerName: ['', Validators.required],
    printerType: ['', Validators.required],
    documentType: ['', Validators.required],
    printerPath: [''],
    paperSize: [''],
    copies: [1],
    printOrientation: ['PORTRAIT'],
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
      this.printerConfigurationService
        .create({
          branchId: value.branchId || undefined,
          printerName: value.printerName,
          printerType: value.printerType,
          documentType: value.documentType,
          printerPath: value.printerPath || undefined,
          paperSize: value.paperSize || undefined,
          copies: value.copies,
          printOrientation: value.printOrientation,
          isDefault: value.isDefault,
          isActive: value.isActive,
          remarks: value.remarks || undefined,
        })
        .subscribe({
          next: (printerConfiguration) => {
            this.saving.set(false);
            this.router.navigate(['/configuration/printer-configurations', printerConfiguration.id]);
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.printerConfigurationService
      .update(this.entityId!, {
        version: this.version(),
        branchId: value.branchId || undefined,
        printerName: value.printerName,
        printerType: value.printerType,
        documentType: value.documentType,
        printerPath: value.printerPath || undefined,
        paperSize: value.paperSize || undefined,
        copies: value.copies,
        printOrientation: value.printOrientation,
        isDefault: value.isDefault,
        isActive: value.isActive,
        remarks: value.remarks || undefined,
      })
      .subscribe({
        next: (printerConfiguration) => {
          this.version.set(printerConfiguration.version);
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
    this.printerConfigurationService.delete(this.entityId, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/configuration/printer-configurations']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/configuration/printer-configurations']);
  }

  private load(id: string): void {
    this.printerConfigurationService.getById(id).subscribe({
      next: (printerConfiguration) => {
        this.version.set(printerConfiguration.version);
        this.form.patchValue({
          branchId: printerConfiguration.branchId ?? '',
          printerName: printerConfiguration.printerName,
          printerType: printerConfiguration.printerType,
          documentType: printerConfiguration.documentType,
          printerPath: printerConfiguration.printerPath ?? '',
          paperSize: printerConfiguration.paperSize ?? '',
          copies: printerConfiguration.copies,
          printOrientation: printerConfiguration.printOrientation,
          isDefault: printerConfiguration.isDefault,
          isActive: printerConfiguration.isActive,
          remarks: printerConfiguration.remarks ?? '',
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
