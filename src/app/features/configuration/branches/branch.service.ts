import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  Branch,
  CreateBranchRequest,
  UpdateBranchRequest,
} from './branch.models';

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/branches';

  list(params: Record<string, string>): Observable<{
    data: Branch[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Branch>(this.basePath, params);
  }

  getById(id: string): Observable<Branch> {
    return this.api.get<Branch>(`${this.basePath}/${id}`);
  }

  create(body: CreateBranchRequest): Observable<Branch> {
    return this.api.post<Branch>(this.basePath, body);
  }

  update(id: string, body: UpdateBranchRequest): Observable<Branch> {
    return this.api.patch<Branch>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
