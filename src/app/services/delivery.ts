import { Injectable, inject } from '@angular/core';
import { ApiClient } from './api-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiClient = inject(ApiClient);

  constructor() { }

  /**
   * Mengirim form bukti pengiriman (Proof of Delivery)
   * @param payload Data form (qty_half, base64 image, dll)
   */
  submitDeliveryProof(payload: any): Observable<any> {
    return this.apiClient.post<any>('driver/delivery-proof', payload);
  }

  /**
   * Mengambil data klasemen harian & target
   */
  getLeaderboard(): Observable<any> {
    return this.apiClient.get<any>('driver/leaderboard');
  }

  /**
   * Mengambil daftar customer aktif untuk dropdown
   */
  getCustomerList(): Observable<any> {
    return this.apiClient.get<any>('driver/customers');
  }
}