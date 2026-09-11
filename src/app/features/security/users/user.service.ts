import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateUserRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  User,
} from './user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/users';

  list(params: Record<string, string>): Observable<{
    data: User[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<User>(this.basePath, params);
  }

  getById(id: string): Observable<User> {
    return this.api.get<User>(`${this.basePath}/${id}`);
  }

  create(body: CreateUserRequest): Observable<User> {
    return this.api.post<User>(this.basePath, body);
  }

  update(id: string, body: UpdateUserRequest): Observable<User> {
    return this.api.patch<User>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }

  resetPassword(id: string, body: ResetPasswordRequest): Observable<User> {
    return this.api.post<User>(`${this.basePath}/${id}/reset-password`, body);
  }

  unlock(id: string): Observable<User> {
    return this.api.post<User>(`${this.basePath}/${id}/unlock`);
  }
}
