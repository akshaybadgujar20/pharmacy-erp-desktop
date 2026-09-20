import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateMedicineSaltRequest,
  MedicineSalt,
  UpdateMedicineSaltRequest,
} from './medicine-salt.models';

@Injectable({ providedIn: 'root' })
export class MedicineSaltService {
  private readonly api = inject(ApiService);

  list(
    medicineId: string,
    params: Record<string, string>,
  ): Observable<{ data: MedicineSalt[]; pagination: Pagination }> {
    return this.api.getPaginated<MedicineSalt>(
      `/medicines/${medicineId}/salts`,
      params,
    );
  }

  getById(medicineId: string, id: string): Observable<MedicineSalt> {
    return this.api.get<MedicineSalt>(`/medicines/${medicineId}/salts/${id}`);
  }

  create(
    medicineId: string,
    body: CreateMedicineSaltRequest,
  ): Observable<MedicineSalt> {
    return this.api.post<MedicineSalt>(`/medicines/${medicineId}/salts`, body);
  }

  update(
    medicineId: string,
    id: string,
    body: UpdateMedicineSaltRequest,
  ): Observable<MedicineSalt> {
    return this.api.patch<MedicineSalt>(
      `/medicines/${medicineId}/salts/${id}`,
      body,
    );
  }

  delete(medicineId: string, id: string, version: string): Observable<void> {
    return this.api.delete<void>(`/medicines/${medicineId}/salts/${id}`, {
      version: String(version),
    });
  }
}
