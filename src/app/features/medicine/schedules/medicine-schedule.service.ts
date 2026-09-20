import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateMedicineScheduleRequest,
  MedicineSchedule,
  UpdateMedicineScheduleRequest,
} from './medicine-schedule.models';

@Injectable({ providedIn: 'root' })
export class MedicineScheduleService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/medicine-schedules';

  list(params: Record<string, string>): Observable<{
    data: MedicineSchedule[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<MedicineSchedule>(this.basePath, params);
  }

  getById(id: string): Observable<MedicineSchedule> {
    return this.api.get<MedicineSchedule>(`${this.basePath}/${id}`);
  }

  create(body: CreateMedicineScheduleRequest): Observable<MedicineSchedule> {
    return this.api.post<MedicineSchedule>(this.basePath, body);
  }

  update(id: string, body: UpdateMedicineScheduleRequest): Observable<MedicineSchedule> {
    return this.api.patch<MedicineSchedule>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
