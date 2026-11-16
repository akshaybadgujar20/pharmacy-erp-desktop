import { ChangeDetectionStrategy, Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';
import { LoyaltyProgramService } from './loyalty-program.service';


import {
  bindDetailScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../core/keyboard';
import { ActiveScreenPrintService } from '../../core/services/active-screen-print.service';
import { ActiveScreenSaveService } from '../../core/services/active-screen-save.service';
import { ShortcutTooltipDirective } from '../../shared/keyboard';
@Component({
  selector: 'app-loyalty-program-detail',
  standalone: true,
  imports: [
    ShortcutTooltipDirective,ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './loyalty-program-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyaltyProgramDetailComponent implements OnInit, OnDestroy {
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSave = inject(ActiveScreenSaveService);
  private readonly activePrint = inject(ActiveScreenPrintService);
  private detailShortcutBinding?: ShortcutBinding;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(LoyaltyProgramService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');
  private programId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    programCode: ['', Validators.required],
    programName: ['', Validators.required],
    pointsPerAmount: ['1', Validators.required],
    redemptionValue: ['1', Validators.required],
    minimumRedemptionPoints: [1, Validators.required],
    effectiveFrom: [new Date().toISOString(), Validators.required],
    isDefault: [false],
    isActive: [true],
  });

  ngOnDestroy(): void {
    this.detailShortcutBinding?.unregister();
  }

  ngOnInit(): void {
    this.detailShortcutBinding = bindDetailScreenShortcuts(
      this.shortcuts,
      this.activeSave,
      this.activePrint,
      {
        save: () => this.save(),
      },
    );

    const id = this.route.snapshot.paramMap.get('programId');
    if (id && id !== 'new') {
      this.isNew.set(false);
      this.programId = id;
      this.service.getById(id).subscribe({
        next: (program) => {
          this.version.set(program.version);
          this.form.patchValue({
            programCode: program.programCode,
            programName: program.programName,
            pointsPerAmount: program.pointsPerAmount,
            redemptionValue: program.redemptionValue,
            minimumRedemptionPoints: program.minimumRedemptionPoints,
            effectiveFrom: program.effectiveFrom,
            isDefault: program.isDefault,
            isActive: program.isActive,
          });
          this.form.controls.programCode.disable();
        },
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    const request = {
      programCode: value.programCode,
      programName: value.programName,
      pointsPerAmount: value.pointsPerAmount,
      redemptionValue: value.redemptionValue,
      minimumRedemptionPoints: value.minimumRedemptionPoints,
      effectiveFrom: value.effectiveFrom,
      isDefault: value.isDefault,
      isActive: value.isActive,
    };
    const op = this.isNew()
      ? this.service.create(request)
      : this.service.update(this.programId!, {
          version: this.version(),
          programName: value.programName,
          pointsPerAmount: value.pointsPerAmount,
          redemptionValue: value.redemptionValue,
          minimumRedemptionPoints: value.minimumRedemptionPoints,
          effectiveFrom: value.effectiveFrom,
          isDefault: value.isDefault,
          isActive: value.isActive,
        });
    op.subscribe({
      next: (program) => {
        this.saving.set(false);
        this.router.navigate(['/loyalty/programs', program.id]);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(resolveApiErrorMessage(error));
      },
    });
  }
}
