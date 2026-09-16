import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateMedicineCategoryRequest,
  MedicineCategory,
  UpdateMedicineCategoryRequest,
} from './medicine-category.models';

@Injectable({ providedIn: 'root' })
export class MedicineCategoryService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/medicine-categories';

  list(params: Record<string, string>): Observable<{
    data: MedicineCategory[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<MedicineCategory>(this.basePath, params);
  }

  getById(id: string): Observable<MedicineCategory> {
    return this.api.get<MedicineCategory>(`${this.basePath}/${id}`);
  }

  create(body: CreateMedicineCategoryRequest): Observable<MedicineCategory> {
    return this.api.post<MedicineCategory>(this.basePath, body);
  }

  update(id: string, body: UpdateMedicineCategoryRequest): Observable<MedicineCategory> {
    return this.api.patch<MedicineCategory>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
