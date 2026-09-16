import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { Area, CreateAreaRequest, UpdateAreaRequest } from './area.models';

@Injectable({ providedIn: 'root' })
export class AreaService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/areas';

  list(params: Record<string, string>): Observable<{
    data: Area[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Area>(this.basePath, params);
  }

  getById(id: string): Observable<Area> {
    return this.api.get<Area>(`${this.basePath}/${id}`);
  }

  create(body: CreateAreaRequest): Observable<Area> {
    return this.api.post<Area>(this.basePath, body);
  }

  update(id: string, body: UpdateAreaRequest): Observable<Area> {
    return this.api.patch<Area>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
