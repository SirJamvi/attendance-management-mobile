import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface BusinessCardPayload {
  customer_name: string;
  customer_phone: string;
  address?: string;
  notes?: string;
  photo: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface BusinessCardKpiData {
  week_target: number;
  week_achieved: number;
  week_progress_percent: number;
  month_target: number;
  month_achieved: number;
  month_progress_percent: number;
  is_weekly_target_reached: boolean;
  is_monthly_target_reached: boolean;
  current_week_count?: number;
  monthly_count?: number;
}

export interface BusinessCardApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class BusinessCardService {
  private apiClient = inject(ApiClient);

  /**
   * Mengirim form bukti penyerahan kartu nama (Business Card Lead)
   */
  submitBusinessCard(payload: BusinessCardPayload): Observable<BusinessCardApiResponse<any>> {
    return this.apiClient.post<BusinessCardApiResponse<any>>('driver/business-cards', payload);
  }

  /**
   * Mengambil ringkasan KPI mingguan & bulanan driver
   */
  getKpi(): Observable<BusinessCardApiResponse<BusinessCardKpiData>> {
    return this.apiClient.get<BusinessCardApiResponse<BusinessCardKpiData>>('driver/business-cards/kpi');
  }

  /**
   * Mengambil riwayat penyerahan kartu nama
   */
  getHistory(page = 1): Observable<BusinessCardApiResponse<any>> {
    return this.apiClient.get<BusinessCardApiResponse<any>>('driver/business-cards/history', { page });
  }
}
