import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { StockMovement } from './stock-movement.models';

@Injectable({ providedIn: 'root' })
export class StockMovementService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/stock-movements';

  list(params: Record<string, string>): Observable<{
    data: StockMovement[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<StockMovement>(this.basePath, params);
  }

  getById(id: string): Observable<StockMovement> {
    return this.api.get<StockMovement>(`${this.basePath}/${id}`);
  }
}
