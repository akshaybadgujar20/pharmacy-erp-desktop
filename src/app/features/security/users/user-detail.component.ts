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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { UserBranchesTabComponent } from './user-branches-tab.component';
import { UserRolesTabComponent } from './user-roles-tab.component';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    TabsModule,
    UserRolesTabComponent,
    UserBranchesTabComponent,
  ],
  templateUrl: './user-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly userId = signal<string | null>(null);
  readonly activeTab = signal('overview');
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly unlocking = signal(false);
  readonly resettingPassword = signal(false);
  readonly resetDialogVisible = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal(0);

  readonly form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    username: ['', Validators.required],
    password: ['', Validators.required],
    isActive: [true],
    mustChangePassword: [false],
  });

  readonly resetPasswordForm = this.fb.nonNullable.group({
    newPassword: ['', Validators.required],
    mustChangePassword: [false],
  });

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    if (userId) {
      this.isNew.set(false);
      this.userId.set(userId);
      this.activeTab.set(this.resolveActiveTab());
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();
      this.form.controls.employeeId.disable();
      this.load(userId);
      return;
    }
    this.form.controls.password.setValidators(Validators.required);
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.userId();
    if (!id) {
      return;
    }
    if (tabValue === 'roles') {
      this.router.navigate(['/security/users', id, 'roles']);
      return;
    }
    if (tabValue === 'branches') {
      this.router.navigate(['/security/users', id, 'branches']);
      return;
    }
    this.router.navigate(['/security/users', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.userService
        .create({
          employeeId: value.employeeId,
          username: value.username,
          password: value.password,
          isActive: value.isActive,
          mustChangePassword: value.mustChangePassword,
        })
        .subscribe({
          next: (user) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.userId.set(user.id);
            this.version.set(user.version);
            this.form.controls.employeeId.disable();
            this.router.navigate(['/security/users', user.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.userService
      .update(this.userId()!, {
        version: this.version(),
        isActive: value.isActive,
        mustChangePassword: value.mustChangePassword,
      })
      .subscribe({
        next: (user) => {
          this.version.set(user.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    const id = this.userId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.userService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/security/users']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  unlockUser(): void {
    const id = this.userId();
    if (!id) {
      return;
    }

    this.unlocking.set(true);
    this.errorMessage.set('');
    this.userService.unlock(id).subscribe({
      next: (user) => {
        this.version.set(user.version);
        this.unlocking.set(false);
      },
      error: (error) => {
        this.unlocking.set(false);
        this.handleError(error);
      },
    });
  }

  openResetPasswordDialog(): void {
    this.resetPasswordForm.reset({ newPassword: '', mustChangePassword: false });
    this.resetDialogVisible.set(true);
  }

  closeResetPasswordDialog(): void {
    this.resetDialogVisible.set(false);
  }

  resetPassword(): void {
    const id = this.userId();
    if (!id || this.resetPasswordForm.invalid) {
      return;
    }

    this.resettingPassword.set(true);
    this.errorMessage.set('');
    const value = this.resetPasswordForm.getRawValue();
    this.userService
      .resetPassword(id, {
        newPassword: value.newPassword,
        mustChangePassword: value.mustChangePassword,
      })
      .subscribe({
        next: (user) => {
          this.version.set(user.version);
          this.resettingPassword.set(false);
          this.closeResetPasswordDialog();
        },
        error: (error) => {
          this.resettingPassword.set(false);
          this.handleError(error);
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/security/users']);
  }

  private load(id: string): void {
    this.userService.getById(id).subscribe({
      next: (user) => {
        this.version.set(user.version);
        this.form.patchValue({
          employeeId: user.employeeId,
          username: user.username,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private resolveActiveTab(): string {
    const segments = this.route.snapshot.url.map((segment) => segment.path);
    if (segments.includes('roles')) {
      return 'roles';
    }
    if (segments.includes('branches')) {
      return 'branches';
    }
    return 'overview';
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
