import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Storage } from './storage'; // Impor Storage service kita
import { from, lastValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private apiUrl = environment.apiUrl; // Ambil URL dari environment

  constructor(private http: HttpClient, private storage: Storage) {}

  /**
   * Helper privat untuk membuat Header Otorisasi secara dinamis
   */
  private getAuthHeaders() {
    // Kita gunakan 'from' untuk mengubah Promise (dari storage) menjadi Observable
    // lalu 'pipe' dan 'switchMap' untuk mengambil token
    return from(this.storage.getToken()).pipe(
      switchMap((token) => {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return from(Promise.resolve(headers));
      })
    );
  }

  /**
   * Wrapper untuk GET request (otomatis menambahkan token)
   */
  public get<T>(endpoint: string, params: HttpParams = new HttpParams()) {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
          headers,
          params,
        });
      })
    );
  }

  /**
   * Wrapper untuk POST request (otomatis menambahkan token)
   */
  public post<T>(endpoint: string, body: any) {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
          headers,
        });
      })
    );
  }

  /**
   * Wrapper untuk POST request dengan FILE (FormData)
   * (Penting untuk Cuti Sakit)
   */
  public postWithFile<T>(endpoint: string, formData: FormData) {
    // Catatan: Saat mengirim FormData, JANGAN atur Content-Type
    // Browser/HttpClient akan mengaturnya secara otomatis
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        // Hapus Content-Type agar browser bisa mengaturnya (penting untuk boundary)
        headers = headers.delete('Content-Type');
        return this.http.post<T>(`${this.apiUrl}/${endpoint}`, formData, {
          headers,
        });
      })
    );
  }

  // Anda bisa menambahkan method 'put' dan 'delete' di sini jika perlu
}