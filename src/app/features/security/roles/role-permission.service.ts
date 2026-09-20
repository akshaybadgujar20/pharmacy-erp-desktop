import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateRolePermissionRequest,
  RolePermission,
  UpdateRolePermissionRequest,
} from './role-permission.models';

@Injectable({ providedIn: 'root' })
export class RolePermissionService {
  private readonly api = inject(ApiService);

  list(
    roleId: string,
    params: Record<string, string>,
  ): Observable<{ data: RolePermission[]; pagination: Pagination }> {
    return this.api.getPaginated<RolePermission>(`/roles/${roleId}/permissions`, params);
  }

  getById(roleId: string, id: string): Observable<RolePermission> {
    return this.api.get<RolePermission>(`/roles/${roleId}/permissions/${id}`);
  }

  create(roleId: string, body: CreateRolePermissionRequest): Observable<RolePermission> {
    return this.api.post<RolePermission>(`/roles/${roleId}/permissions`, body);
  }

  update(
    roleId: string,
    id: string,
    body: UpdateRolePermissionRequest,
  ): Observable<RolePermission> {
    return this.api.patch<RolePermission>(`/roles/${roleId}/permissions/${id}`, body);
  }

  delete(roleId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/roles/${roleId}/permissions/${id}`, {
      version: String(version),
    });
  }
}
