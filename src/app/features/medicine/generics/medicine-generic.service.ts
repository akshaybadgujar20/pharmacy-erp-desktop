import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateMedicineGenericRequest,
  MedicineGeneric,
  UpdateMedicineGenericRequest,
} from './medicine-generic.models';

@Injectable({ providedIn: 'root' })
export class MedicineGenericService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/medicine-generics';

  list(params: Record<string, string>): Observable<{
    data: MedicineGeneric[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<MedicineGeneric>(this.basePath, params);
  }

  getById(id: string): Observable<MedicineGeneric> {
    return this.api.get<MedicineGeneric>(`${this.basePath}/${id}`);
  }

  create(body: CreateMedicineGenericRequest): Observable<MedicineGeneric> {
    return this.api.post<MedicineGeneric>(this.basePath, body);
  }

  update(id: string, body: UpdateMedicineGenericRequest): Observable<MedicineGeneric> {
    return this.api.patch<MedicineGeneric>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
