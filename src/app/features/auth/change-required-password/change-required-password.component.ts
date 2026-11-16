import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { firstValueFrom } from 'rxjs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-change-required-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ButtonModule, InputTextModule],
  templateUrl: './change-required-password.component.html',
  styleUrl: './change-required-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeRequiredPasswordComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly saving = signal(false);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    currentPassword: ['', [Validators.required, Validators.maxLength(128)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  ngOnInit(): void {
    const username = this.route.snapshot.queryParamMap.get('username');
    if (username) {
      this.form.patchValue({ username });
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.message.set('');
    try {
      await firstValueFrom(
        this.api.post('/auth/change-required-password', this.form.getRawValue()),
      );
      await this.router.navigate(['/login'], {
        queryParams: { passwordChanged: '1' },
      });
    } catch (error) {
      this.message.set(
        error instanceof ApiClientError ? error.message : 'Update failed',
      );
    } finally {
      this.saving.set(false);
    }
  }
}