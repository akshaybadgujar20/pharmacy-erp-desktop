import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateUserRoleRequest,
  UpdateUserRoleRequest,
  UserRole,
} from './user-role.models';

@Injectable({ providedIn: 'root' })
export class UserRoleService {
  private readonly api = inject(ApiService);

  list(
    userId: string,
    params: Record<string, string>,
  ): Observable<{ data: UserRole[]; pagination: Pagination }> {
    return this.api.getPaginated<UserRole>(`/users/${userId}/roles`, params);
  }

  getById(userId: string, id: string): Observable<UserRole> {
    return this.api.get<UserRole>(`/users/${userId}/roles/${id}`);
  }

  create(userId: string, body: CreateUserRoleRequest): Observable<UserRole> {
    return this.api.post<UserRole>(`/users/${userId}/roles`, body);
  }

  update(
    userId: string,
    id: string,
    body: UpdateUserRoleRequest,
  ): Observable<UserRole> {
    return this.api.patch<UserRole>(`/users/${userId}/roles/${id}`, body);
  }

  delete(userId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/users/${userId}/roles/${id}`, {
      version: String(version),
    });
  }
}
