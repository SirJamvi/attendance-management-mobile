import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Storage } from './storage';

@Injectable({
  providedIn: 'root'
})
export class ApiClient {
  private http = inject(HttpClient);
  private storage = inject(Storage);
  private apiUrl = environment.apiUrl;

  constructor() {}

  /**
   * GET request dengan auto token injection
   */
  get<T>(endpoint: string): Observable<T> {
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token);
        const url = `${this.apiUrl}/${endpoint}`;
        console.log('🌐 ApiClient GET:', url);
        console.log('🔑 Token:', token ? 'ADA' : 'TIDAK ADA');
        return this.http.get<T>(url, { headers });
      })
    );
  }

  /**
   * POST request dengan auto token injection
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token);
        const url = `${this.apiUrl}/${endpoint}`;
        console.log('🌐 ApiClient POST:', url);
        console.log('🔑 Token:', token ? 'ADA' : 'TIDAK ADA');
        console.log('📦 Body:', body);
        return this.http.post<T>(url, body, { headers });
      })
    );
  }

  /**
   * PUT request dengan auto token injection
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token);
        const url = `${this.apiUrl}/${endpoint}`;
        console.log('🌐 ApiClient PUT:', url);
        return this.http.put<T>(url, body, { headers });
      })
    );
  }

  /**
   * DELETE request dengan auto token injection
   */
  delete<T>(endpoint: string): Observable<T> {
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        const headers = this.buildHeaders(token);
        const url = `${this.apiUrl}/${endpoint}`;
        console.log('🌐 ApiClient DELETE:', url);
        return this.http.delete<T>(url, { headers });
      })
    );
  }

  /**
   * Helper untuk build headers dengan token
   */
  private buildHeaders(token: string | null): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('✅ Authorization header ditambahkan');
    } else {
      console.log('⚠️ Token tidak ada, request tanpa Authorization');
    }

    return headers;
  }
}