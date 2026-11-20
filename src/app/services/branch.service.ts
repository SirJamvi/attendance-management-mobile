import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiClient } from './api-client';
import { ApiResponse, Branch } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private apiClient = inject(ApiClient);
  private branches$?: Observable<ApiResponse<Branch[]>>;

  /**
   * Mengambil daftar cabang aktif operasional dari endpoint /api/v1/branches.
   */
  getBranches(refresh = false): Observable<ApiResponse<Branch[]>> {
    if (!this.branches$ || refresh) {
      this.branches$ = this.apiClient
        .get<ApiResponse<Branch[]>>('branches')
        .pipe(shareReplay(1));
    }
    return this.branches$;
  }
}
