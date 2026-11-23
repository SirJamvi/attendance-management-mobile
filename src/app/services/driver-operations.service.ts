import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  ApiResponse,
  VehicleOption,
  ChecksheetFormDetailResponse,
  ChecksheetSubmitPayload,
  ChecksheetSubmitResult,
  DriverDeliveryItemInput,
  DriverDeliveryPayload,
  DriverDeliveryTodayData,
  DriverDeliveryHistoryData,
  DriverPosOrdersResponse,
} from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class DriverOperationsService {
  private apiClient = inject(ApiClient);

  // ==========================================
  // A. INSPEKSI BENSIN & KONDISI ARMADA
  // ==========================================

  getVehicles(branchId?: number | null): Observable<ApiResponse<VehicleOption[]>> {
    const params: Record<string, number> = {};
    if (branchId !== undefined && branchId !== null) {
      params['branch_id'] = branchId;
    }
    return this.apiClient.get<ApiResponse<VehicleOption[]>>('driver/vehicles', params);
  }

  getTodayChecksheets(date?: string): Observable<ApiResponse<any>> {
    return this.apiClient.get<ApiResponse<any>>('driver/checksheets/today', { date });
  }

  getChecksheetForm(
    slug = 'shared-inspeksi-bensin-armada',
    params?: { form_schedule_id?: number | null; vehicle_id?: number | null }
  ): Observable<ApiResponse<ChecksheetFormDetailResponse>> {
    return this.apiClient.get<ApiResponse<ChecksheetFormDetailResponse>>(
      `driver/checksheets/${slug}`,
      params
    );
  }

  submitChecksheet(
    slug = 'shared-inspeksi-bensin-armada',
    payload: ChecksheetSubmitPayload
  ): Observable<ApiResponse<ChecksheetSubmitResult>> {
    return this.apiClient.post<ApiResponse<ChecksheetSubmitResult>>(
      `driver/checksheets/${slug}/submit`,
      payload
    );
  }

  // ==========================================
  // B. PENGIRIMAN DRIVER (INTEGRASI POS BUKU-DIGITAL)
  // ==========================================

  getPosOrders(date?: string): Observable<ApiResponse<DriverPosOrdersResponse>> {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    return this.apiClient.get<ApiResponse<DriverPosOrdersResponse>>('driver/deliveries/pos-orders', params);
  }

  getUnassignedPosOrders(date?: string): Observable<ApiResponse<any[]>> {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    return this.apiClient.get<ApiResponse<any[]>>('driver/deliveries/unassigned-pos-orders', params);
  }

  getCustomers(): Observable<ApiResponse<any[]>> {
    return this.apiClient.get<ApiResponse<any[]>>('driver/customers');
  }

  confirmPosDeliveries(payload: {
    vehicle_id?: number | null;
    proof_photo?: string | null;
    delivery_date?: string;
  }): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>('driver/deliveries/confirm-pos', payload);
  }

  parseWaText(
    raw_wa_text: string
  ): Observable<ApiResponse<{ items: DriverDeliveryItemInput[]; summary?: any }>> {
    return this.apiClient.post<ApiResponse<{ items: DriverDeliveryItemInput[]; summary?: any }>>(
      'driver/deliveries/parse-wa',
      { raw_wa_text }
    );
  }

  submitBulkDelivery(payload: DriverDeliveryPayload): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>('driver/deliveries', payload);
  }

  getTodayDeliveries(): Observable<ApiResponse<DriverDeliveryTodayData>> {
    return this.apiClient.get<ApiResponse<DriverDeliveryTodayData>>('driver/deliveries/today');
  }

  getDeliveryHistory(params?: {
    month?: string;
    date?: string;
  }): Observable<ApiResponse<DriverDeliveryHistoryData>> {
    return this.apiClient.get<ApiResponse<DriverDeliveryHistoryData>>(
      'driver/deliveries/history',
      params
    );
  }

  // ==========================================
  // C. BUSINESS CARD LEADS & KPI MINGGUAN
  // ==========================================

  submitBusinessCard(payload: any): Observable<ApiResponse<any>> {
    return this.apiClient.post<ApiResponse<any>>('driver/business-cards', payload);
  }

  getBusinessCardKpi(): Observable<ApiResponse<any>> {
    return this.apiClient.get<ApiResponse<any>>('driver/business-cards/kpi');
  }

  getBusinessCardHistory(page = 1): Observable<ApiResponse<any>> {
    return this.apiClient.get<ApiResponse<any>>('driver/business-cards/history', { page });
  }
}
