import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { City, CreateCityRequest, UpdateCityRequest } from './city.models';

@Injectable({ providedIn: 'root' })
export class CityService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/cities';

  list(params: Record<string, string>): Observable<{
    data: City[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<City>(this.basePath, params);
  }

  getById(id: string): Observable<City> {
    return this.api.get<City>(`${this.basePath}/${id}`);
  }

  create(body: CreateCityRequest): Observable<City> {
    return this.api.post<City>(this.basePath, body);
  }

  update(id: string, body: UpdateCityRequest): Observable<City> {
    return this.api.patch<City>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
