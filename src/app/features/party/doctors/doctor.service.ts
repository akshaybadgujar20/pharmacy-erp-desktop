import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { CreateDoctorRequest, Doctor, UpdateDoctorRequest } from './doctor.models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/doctors';

  list(params: Record<string, string>): Observable<{
    data: Doctor[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Doctor>(this.basePath, params);
  }

  getById(id: string): Observable<Doctor> {
    return this.api.get<Doctor>(`${this.basePath}/${id}`);
  }

  create(body: CreateDoctorRequest): Observable<Doctor> {
    return this.api.post<Doctor>(this.basePath, body);
  }

  update(id: string, body: UpdateDoctorRequest): Observable<Doctor> {
    return this.api.patch<Doctor>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
