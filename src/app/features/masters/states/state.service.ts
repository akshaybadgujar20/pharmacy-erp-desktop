import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { CreateStateRequest, State, UpdateStateRequest } from './state.models';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/states';

  list(params: Record<string, string>): Observable<{
    data: State[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<State>(this.basePath, params);
  }

  getById(id: string): Observable<State> {
    return this.api.get<State>(`${this.basePath}/${id}`);
  }

  create(body: CreateStateRequest): Observable<State> {
    return this.api.post<State>(this.basePath, body);
  }

  update(id: string, body: UpdateStateRequest): Observable<State> {
    return this.api.patch<State>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
