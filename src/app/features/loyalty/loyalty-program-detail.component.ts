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
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';
import { LoyaltyProgramService } from './loyalty-program.service';

@Component({
  selector: 'app-loyalty-program-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './loyalty-program-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyaltyProgramDetailComponent implements OnInit {
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

  ngOnInit(): void {
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
