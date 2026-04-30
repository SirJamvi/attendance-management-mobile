import { Injectable } from '@angular/core';
import { ApiClient } from '../api-client'; // Memanggil jembatan API bawaan aplikasi Anda
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashAdvanceService {

  constructor(private apiClient: ApiClient) { }

  // 1. Fungsi untuk menarik riwayat kasbon
  getHistory(): Observable<any> {
    // ApiClient sudah otomatis menambahkan environment.apiUrl dan Bearer Token!
    return this.apiClient.get('cash-advances');
  }

  // 2. Fungsi untuk mengirim pengajuan kasbon baru
  submitRequest(data: { amount: number, installment_duration: number, reason: string }): Observable<any> {
    return this.apiClient.post('cash-advances', data);
  }
}