import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  ApiResponse,
  ChecksheetTodayData,
  ChecksheetIncidentalData,
  ChecksheetFormDetailResponse,
  ChecksheetSubmitPayload,
  ChecksheetSubmitResult,
  KoDeliveriesData,
  KoDeliveryItem,
  KoKpiSummary,
} from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class KoOperationsService {
  private apiClient = inject(ApiClient);

  // ==========================================
  // A. CHECKSHEET 3 FASE & INSIDENTAL
  // ==========================================

  getTodayChecksheets(date?: string): Observable<ApiResponse<ChecksheetTodayData>> {
    return this.apiClient.get<ApiResponse<ChecksheetTodayData>>('ko/checksheets/today', {
      date,
    });
  }

  getIncidentalChecksheets(): Observable<ApiResponse<ChecksheetIncidentalData>> {
    return this.apiClient.get<ApiResponse<ChecksheetIncidentalData>>('ko/checksheets/incidental');
  }

  getChecksheetForm(
    slug: string,
    params?: { form_schedule_id?: number | null; vehicle_id?: number | null }
  ): Observable<ApiResponse<ChecksheetFormDetailResponse>> {
    return this.apiClient.get<ApiResponse<ChecksheetFormDetailResponse>>(
      `ko/checksheets/${slug}`,
      params
    );
  }

  submitChecksheet(
    slug: string,
    payload: ChecksheetSubmitPayload
  ): Observable<ApiResponse<ChecksheetSubmitResult>> {
    return this.apiClient.post<ApiResponse<ChecksheetSubmitResult>>(
      `ko/checksheets/${slug}/submit`,
      payload
    );
  }

  getChecksheetHistory(params?: {
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Observable<ApiResponse<any>> {
    return this.apiClient.get<ApiResponse<any>>('ko/checksheets/history', params);
  }

  // ==========================================
  // B. APPROVAL DELIVERY DRIVER & CROSS-CHECK POS
  // ==========================================

  getDeliveries(params?: {
    date?: string;
    status?: string;
  }): Observable<ApiResponse<KoDeliveriesData>> {
    return this.apiClient.get<ApiResponse<KoDeliveriesData>>('ko/deliveries', params);
  }

  getDeliveryDetail(id: number): Observable<ApiResponse<KoDeliveryItem>> {
    return this.apiClient.get<ApiResponse<KoDeliveryItem>>(`ko/deliveries/${id}`);
  }

  approveDelivery(id: number): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>(`ko/deliveries/${id}/approve`, {});
  }

  rejectDelivery(id: number, rejection_reason: string): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>(`ko/deliveries/${id}/reject`, {
      rejection_reason,
    });
  }

  bypassDriverCheckout(attendanceId: number, reason: string): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>(
      `ko/drivers/${attendanceId}/bypass-checkout`,
      { reason }
    );
  }

  // ==========================================
  // C. ESTIMASI KPI BULANAN KO
  // ==========================================

  getKpiSummary(month?: string): Observable<ApiResponse<KoKpiSummary>> {
    return this.apiClient.get<ApiResponse<KoKpiSummary>>('ko/kpi/summary', { month });
  }
}
