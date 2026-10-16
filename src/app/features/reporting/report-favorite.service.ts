import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

export interface ReportFavorite {
  id: string;
  reportCode: string;
  sortOrder: number;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class ReportFavoriteService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<ReportFavorite[]>('/report-favorites');
  }

  add(reportCode: string) {
    return this.api.post<ReportFavorite>('/report-favorites', { reportCode });
  }

  remove(id: string, version: string) {
    return this.api.delete<void>(`/report-favorites/${id}`, { version });
  }
}
