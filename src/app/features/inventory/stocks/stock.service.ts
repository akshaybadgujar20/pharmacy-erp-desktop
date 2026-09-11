import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Pagination } from '../../../core/models/api-response.types';
import { Stock } from './stock.models';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/stocks';

  list(params: Record<string, string>): Observable<{
    data: Stock[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<Stock>(this.basePath, params);
  }

  getById(id: string): Observable<Stock> {
    return this.api.get<Stock>(`${this.basePath}/${id}`);
  }
}
