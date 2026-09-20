import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import { CreateRoleRequest, Role, UpdateRoleRequest } from './role.models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/roles';

  list(params: Record<string, string>): Observable<{
    data: Role[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Role>(this.basePath, params);
  }

  getById(id: string): Observable<Role> {
    return this.api.get<Role>(`${this.basePath}/${id}`);
  }

  create(body: CreateRoleRequest): Observable<Role> {
    return this.api.post<Role>(this.basePath, body);
  }

  update(id: string, body: UpdateRoleRequest): Observable<Role> {
    return this.api.patch<Role>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
