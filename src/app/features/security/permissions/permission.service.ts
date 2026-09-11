import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import { Permission } from './permission.models';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/permissions';

  list(params: Record<string, string>): Observable<{
    data: Permission[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Permission>(this.basePath, params);
  }

  getById(id: string): Observable<Permission> {
    return this.api.get<Permission>(`${this.basePath}/${id}`);
  }
}
