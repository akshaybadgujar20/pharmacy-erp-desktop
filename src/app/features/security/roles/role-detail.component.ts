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
import { TabsModule } from 'primeng/tabs';
import { ApiClientError } from '../../../core/models/api-response.types';
import { RolePermissionsTabComponent } from './role-permissions-tab.component';
import { RoleService } from './role.service';

@Component({
  selector: 'app-role-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    TabsModule,
    RolePermissionsTabComponent,
  ],
  templateUrl: './role-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly roleService = inject(RoleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isNew = signal(true);
  readonly roleId = signal<string | null>(null);
  readonly activeTab = signal('overview');
  readonly isSystemRole = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');

  readonly form = this.fb.nonNullable.group({
    roleCode: ['', Validators.required],
    roleName: ['', Validators.required],
    description: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('roleId');
    if (roleId) {
      this.isNew.set(false);
      this.roleId.set(roleId);
      this.activeTab.set(this.resolveActiveTab());
      this.load(roleId);
    }
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === undefined) {
      return;
    }
    const tabValue = String(tab);
    this.activeTab.set(tabValue);
    const id = this.roleId();
    if (!id) {
      return;
    }
    if (tabValue === 'permissions') {
      this.router.navigate(['/security/roles', id, 'permissions']);
      return;
    }
    this.router.navigate(['/security/roles', id]);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    if (this.isNew()) {
      this.roleService
        .create({
          roleCode: value.roleCode,
          roleName: value.roleName,
          description: value.description || undefined,
          isActive: value.isActive,
        })
        .subscribe({
          next: (role) => {
            this.saving.set(false);
            this.isNew.set(false);
            this.roleId.set(role.id);
            this.version.set(role.version);
            this.isSystemRole.set(role.isSystemRole);
            this.router.navigate(['/security/roles', role.id], { replaceUrl: true });
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    this.roleService
      .update(this.roleId()!, {
        version: this.version(),
        roleCode: value.roleCode,
        roleName: value.roleName,
        description: value.description || undefined,
        isActive: value.isActive,
      })
      .subscribe({
        next: (role) => {
          this.version.set(role.version);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  deleteRecord(): void {
    const id = this.roleId();
    if (!id) {
      return;
    }

    this.deleting.set(true);
    this.errorMessage.set('');
    this.roleService.delete(id, this.version()).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/security/roles']);
      },
      error: (error) => {
        this.deleting.set(false);
        this.handleError(error);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/security/roles']);
  }

  private load(id: string): void {
    this.roleService.getById(id).subscribe({
      next: (role) => {
        this.version.set(role.version);
        this.isSystemRole.set(role.isSystemRole);
        this.form.patchValue({
          roleCode: role.roleCode,
          roleName: role.roleName,
          description: role.description ?? '',
          isActive: role.isActive,
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  private resolveActiveTab(): string {
    const segments = this.route.snapshot.url.map((segment) => segment.path);
    if (segments.includes('permissions')) {
      return 'permissions';
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
