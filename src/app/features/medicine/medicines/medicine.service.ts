import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateMedicineRequest,
  Medicine,
  UpdateMedicineRequest,
} from './medicine.models';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/medicines';

  list(params: Record<string, string>): Observable<{
    data: Medicine[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Medicine>(this.basePath, params);
  }

  getById(id: string): Observable<Medicine> {
    return this.api.get<Medicine>(`${this.basePath}/${id}`);
  }

  create(body: CreateMedicineRequest): Observable<Medicine> {
    return this.api.post<Medicine>(this.basePath, body);
  }

  update(id: string, body: UpdateMedicineRequest): Observable<Medicine> {
    return this.api.patch<Medicine>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
