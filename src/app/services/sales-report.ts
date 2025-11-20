import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';
import { HttpParams } from '@angular/common/http'; // <-- TAMBAHKAN INI

@Injectable({
  providedIn: 'root',
})
// PERBAIKAN: Ganti nama class menjadi 'SalesReportService'
export class SalesReportService {
  constructor(private apiClient: ApiClient) {}

  getDashboard() {
    return this.apiClient.get<ApiResponse<any>>('sales/dashboard');
  }
  
  getVisitHistoryToday() {
    return this.apiClient.get<ApiResponse<any>>('sales/visits');
  }

  submitVisitReport(data: any) {
    return this.apiClient.post<ApiResponse<any>>('sales/visits', data);
  }

  getDailyReport() {
    return this.apiClient.get<ApiResponse<any>>('sales/daily-report');
  }

  submitDailyReport(obstacles: string, tomorrow_plan: string) {
    const body = { obstacles, tomorrow_plan };
    return this.apiClient.post<ApiResponse<any>>('sales/daily-report', body);
  }

  // Mengambil riwayat gabungan
  getHistory(startDate?: string, endDate?: string) {
    
    // --- PERBAIKAN UNTUK ERROR TYPE '{}' ---
    // Beri tahu TypeScript bahwa 'params' adalah objek string
    let params: { [key: string]: string } = {};
    // --- AKHIR PERBAIKAN ---

    if (startDate) params['start_date'] = startDate;
    if (endDate) params['end_date'] = endDate;
    
    // Kirim objek HttpParams baru
    return this.apiClient.get<ApiResponse<any>>('sales/history', new HttpParams({ fromObject: params }));
  }
}