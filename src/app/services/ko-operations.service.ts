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

  getTodayChecksheets(date?: string, branchId?: number | string): Observable<ApiResponse<ChecksheetTodayData>> {
    const params: Record<string, any> = {};
    if (date) params['date'] = date;
    if (branchId !== undefined && branchId !== null) params['branch_id'] = branchId;
    return this.apiClient.get<ApiResponse<ChecksheetTodayData>>('ko/checksheets/today', params);
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

  verifyInspection(
    submissionId: number,
    payload: { status: 'approved' | 'needs_review' | 'rejected'; review_notes?: string }
  ): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>(
      `ko/checksheets/submissions/${submissionId}/verify`,
      payload
    );
  }

  // ==========================================
  // B. APPROVAL DELIVERY DRIVER & CROSS-CHECK POS
  // ==========================================

  getDeliveries(params?: {
    date?: string;
    status?: string;
    branch_id?: number | string;
  }): Observable<ApiResponse<KoDeliveriesData>> {
    return this.apiClient.get<ApiResponse<KoDeliveriesData>>('ko/deliveries', params);
  }

  getDeliveryDetail(id: number): Observable<ApiResponse<KoDeliveryItem>> {
    return this.apiClient.get<ApiResponse<KoDeliveryItem>>(`ko/deliveries/${id}`);
  }

  approveDelivery(id: number): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>(`ko/deliveries/${id}/approve`, {});
  }

  approveDriverBatch(driverId: number, deliveryDate?: string, branchId?: number | string): Observable<ApiResponse<any>> {
    const payload: Record<string, any> = {
      driver_id: driverId,
      delivery_date: deliveryDate,
    };
    if (branchId !== undefined && branchId !== null) {
      payload['branch_id'] = branchId;
    }
    return this.apiClient.post<ApiResponse<any>>('ko/deliveries/approve-driver-batch', payload);
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
  // C. VALIDASI KARTU NAMA / PROSPEK PELANGGAN
  // ==========================================

  getBusinessCards(params?: {
    date?: string;
    month?: string;
    status?: string;
    driver_id?: number;
    branch_id?: number | string;
  }): Observable<ApiResponse<{ branch_id: number | string; branch_name?: string; cards: any[]; pending_count: number; total_count: number }>> {
    return this.apiClient.get('ko/business-cards', params);
  }

  verifyBusinessCard(
    id: number,
    decision: 'valid' | 'rejected',
    rejection_reason?: string
  ): Observable<ApiResponse<any>> {
    return this.apiClient.post(`ko/business-cards/${id}/verify`, {
      decision,
      rejection_reason,
    });
  }

  // ==========================================
  // D. ESTIMASI KPI BULANAN KO
  // ==========================================

  getKpiSummary(month?: string): Observable<ApiResponse<KoKpiSummary>> {
    return this.apiClient.get<ApiResponse<KoKpiSummary>>('ko/kpi/summary', { month });
  }
}
