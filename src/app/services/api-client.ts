import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, from, switchMap, catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root'
})
export class ApiClient {
  private http = inject(HttpClient);
  private storage = inject(Storage);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  // Max 12 seconds per request so UI never hangs indefinitely on mobile
  private readonly REQUEST_TIMEOUT_MS = 12000;

  private unauthorizedSubject = new Subject<void>();
  public readonly unauthorized$ = this.unauthorizedSubject.asObservable();

  /**
   * GET request dengan auto token injection, optional query params, dan timeout
   */
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<T> {
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token, false);
        const url = this.buildUrl(endpoint);
        const httpParams = this.buildParams(params);
        return this.http.get<T>(url, { headers, params: httpParams }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS),
          catchError((err) => this.handleError(err, endpoint))
        );
      })
    );
  }

  /**
   * POST request dengan auto token injection (mendukung JSON & FormData)
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token, isFormData);
        const url = this.buildUrl(endpoint);
        return this.http.post<T>(url, body, { headers }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS),
          catchError((err) => this.handleError(err, endpoint))
        );
      })
    );
  }

  /**
   * PUT request dengan auto token injection
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token, isFormData);
        const url = this.buildUrl(endpoint);
        return this.http.put<T>(url, body, { headers }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS),
          catchError((err) => this.handleError(err, endpoint))
        );
      })
    );
  }

  /**
   * DELETE request dengan auto token injection
   */
  delete<T>(endpoint: string): Observable<T> {
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token, false);
        const url = this.buildUrl(endpoint);
        return this.http.delete<T>(url, { headers }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS),
          catchError((err) => this.handleError(err, endpoint))
        );
      })
    );
  }

  private buildUrl(endpoint: string): string {
    const clean = endpoint.replace(/^\/+/, '');
    return `${this.apiUrl}/${clean}`;
  }

  private buildParams(params?: Record<string, string | number | boolean | null | undefined>): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return httpParams;
  }

  private buildHeaders(token: string | null, isFormData: boolean): HttpHeaders {
    const headerObj: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (!isFormData) {
      headerObj['Content-Type'] = 'application/json';
    }

    if (token) {
      headerObj['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headerObj);
  }

  private handleError(err: any, endpoint: string) {
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    const isAuthEndpoint = cleanEndpoint === 'login' || cleanEndpoint === 'auth/google';

    if (err instanceof TimeoutError) {
      console.warn(`⏱️ Request timeout (${this.REQUEST_TIMEOUT_MS}ms) on: ${cleanEndpoint}`);
      return throwError(() => ({
        status: 408,
        message: 'Koneksi ke server lambat / timeout. Periksa sinyal internet Anda.',
        error: { message: 'Koneksi ke server lambat / timeout. Periksa sinyal internet Anda.' },
      }));
    }

    if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthEndpoint) {
      console.warn('🔒 HTTP 401 Unauthorized on', cleanEndpoint, '- checking session status');
      if (this.router.url !== '/login') {
        this.storage.clearSession().finally(() => {
          this.unauthorizedSubject.next();
          this.router.navigate(['/login'], { replaceUrl: true });
        });
      }
    }

    return throwError(() => err);
  }
}
