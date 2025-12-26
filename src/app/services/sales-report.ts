import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
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

  getHistory(startDate?: string, endDate?: string) {
    let url = 'sales/history';
    
    const params: string[] = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.apiClient.get<ApiResponse<any>>(url);
  }
}