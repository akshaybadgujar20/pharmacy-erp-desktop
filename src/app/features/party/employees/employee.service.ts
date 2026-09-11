import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import {
  CreateEmployeeRequest,
  Employee,
  UpdateEmployeeRequest,
} from './employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/employees';

  list(params: Record<string, string>): Observable<{
    data: Employee[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Employee>(this.basePath, params);
  }

  getById(id: string): Observable<Employee> {
    return this.api.get<Employee>(`${this.basePath}/${id}`);
  }

  create(body: CreateEmployeeRequest): Observable<Employee> {
    return this.api.post<Employee>(this.basePath, body);
  }

  update(id: string, body: UpdateEmployeeRequest): Observable<Employee> {
    return this.api.patch<Employee>(`${this.basePath}/${id}`, body);
  }

  delete(id: string, version: number): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`, {
      version: String(version),
    });
  }
}
