import { AuthService } from '../../../../core/services/auth.service';
import { FormFieldConfig } from '../types/form-field.types';

export interface FormAccessContext {
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export function createFormAccessContext(auth: AuthService): FormAccessContext {
  return {
    hasPermission: (permission) => auth.hasPermission(permission),
    hasAnyRole: (roles) => auth.hasAnyRole(roles),
  };
}

interface AccessControlled {
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  role?: string;
  roles?: string[];
  hidden?: boolean;
}

function passesAccessRules(
  item: AccessControlled,
  access: FormAccessContext,
): boolean {
  if (item.permission && !access.hasPermission(item.permission)) {
    return false;
  }
  if (item.permissions?.length) {
    const allowed = item.permissions.every((p) => access.hasPermission(p));
    if (!allowed) {
      return false;
    }
  }
  if (item.anyPermission?.length) {
    const allowed = item.anyPermission.some((p) => access.hasPermission(p));
    if (!allowed) {
      return false;
    }
  }
  if (item.role && !access.hasAnyRole([item.role])) {
    return false;
  }
  if (item.roles?.length && !access.hasAnyRole(item.roles)) {
    return false;
  }
  return true;
}

export function isFieldVisible<T extends object>(
  field: FormFieldConfig<T>,
  formValue: Partial<T>,
  access: FormAccessContext,
): boolean {
  if (field.hidden) {
    return false;
  }
  if (!passesAccessRules(field, access)) {
    return false;
  }
  if (field.visible && !field.visible(formValue)) {
    return false;
  }
  return true;
}

export function filterVisibleFields<T extends object>(
  fields: FormFieldConfig<T>[],
  formValue: Partial<T>,
  access: FormAccessContext,
): FormFieldConfig<T>[] {
  return fields.filter((field) => isFieldVisible(field, formValue, access));
}
