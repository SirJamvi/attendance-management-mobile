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
} from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class DriverOperationsService {
  private apiClient = inject(ApiClient);

  // ==========================================
  // A. INSPEKSI BENSIN & KONDISI ARMADA
  // ==========================================

  getVehicles(): Observable<ApiResponse<VehicleOption[]>> {
    return this.apiClient.get<ApiResponse<VehicleOption[]>>('driver/vehicles');
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
  // B. BULK INPUT DELIVERY (MAGIC PASTE WA & MANUAL)
  // ==========================================

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
}
