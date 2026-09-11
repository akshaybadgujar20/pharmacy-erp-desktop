import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagination } from '../../../core/models/api-response.types';
import { ApiService } from '../../../core/services/api.service';
import { UserSession } from './user-session.models';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly api = inject(ApiService);
  private readonly basePath = '/user-sessions';

  list(params: Record<string, string>): Observable<{
    data: UserSession[];
    pagination: Pagination;
  }> {
    return this.api.getPaginated<UserSession>(this.basePath, params);
  }

  getById(id: string): Observable<UserSession> {
    return this.api.get<UserSession>(`${this.basePath}/${id}`);
  }

  forceLogout(id: string): Observable<UserSession> {
    return this.api.post<UserSession>(`${this.basePath}/${id}/force-logout`);
  }
}
