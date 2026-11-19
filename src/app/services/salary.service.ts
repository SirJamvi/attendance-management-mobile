import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { ApiResponse, DeliveryKpiSummary } from '../types/api.types';

export interface SalaryData {
  period: string;
  shift_info: string;
  daily_wage: number;
  total_attendance: number;
  total_overtime: number;
  total_gross_salary: number;
  total_lates: number;
  penalty_amount: number;

  // Gamification
  gamification_bonus: number;
  gamification_title?: string;

  // KPI Pengiriman Bulan Ini (Baru)
  delivery_kpi?: DeliveryKpiSummary | null;

  final_salary: number;
  severe_warning?: boolean;
  warning_message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SalaryService {
  private apiClient = inject(ApiClient);

  getDriverSalary(): Observable<ApiResponse<SalaryData>> {
    return this.apiClient.get<ApiResponse<SalaryData>>('driver/salary');
  }
}
