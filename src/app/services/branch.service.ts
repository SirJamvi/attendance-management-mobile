import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, catchError, throwError } from 'rxjs';
import { ApiClient } from './api-client';
import { ApiResponse, Branch } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private apiClient = inject(ApiClient);
  private branches$?: Observable<ApiResponse<Branch[]>>;

  constructor() {
    this.apiClient.unauthorized$.subscribe(() => {
      this.clearCache();
    });
  }

  clearCache(): void {
    this.branches$ = undefined;
  }

  /**
   * Mengambil daftar cabang aktif operasional dari endpoint /api/v1/branches.
   */
  getBranches(refresh = false): Observable<ApiResponse<Branch[]>> {
    if (!this.branches$ || refresh) {
      this.branches$ = this.apiClient
        .get<ApiResponse<Branch[]>>('branches')
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError((err) => {
            this.clearCache();
            return throwError(() => err);
          })
        );
    }
    return this.branches$;
  }
}
