import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateUserBranchRequest,
  UpdateUserBranchRequest,
  UserBranch,
} from './user-branch.models';

@Injectable({ providedIn: 'root' })
export class UserBranchService {
  private readonly api = inject(ApiService);

  list(
    userId: string,
    params: Record<string, string>,
  ): Observable<{ data: UserBranch[]; pagination: Pagination }> {
    return this.api.getPaginated<UserBranch>(`/users/${userId}/branches`, params);
  }

  getById(userId: string, id: string): Observable<UserBranch> {
    return this.api.get<UserBranch>(`/users/${userId}/branches/${id}`);
  }

  create(userId: string, body: CreateUserBranchRequest): Observable<UserBranch> {
    return this.api.post<UserBranch>(`/users/${userId}/branches`, body);
  }

  update(
    userId: string,
    id: string,
    body: UpdateUserBranchRequest,
  ): Observable<UserBranch> {
    return this.api.patch<UserBranch>(`/users/${userId}/branches/${id}`, body);
  }

  delete(userId: string, id: string, version: number): Observable<void> {
    return this.api.delete<void>(`/users/${userId}/branches/${id}`, {
      version: String(version),
    });
  }
}
