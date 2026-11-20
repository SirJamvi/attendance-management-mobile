import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { ApiResponse, DeliveryKpiSummary } from '../types/api.types';

export interface InspectionKpiSummary {
  working_days: number;
  days_completed_target: number;
  total_inspections: number;
  target_per_day: number;
  target_achievement_percent: number;
}

export interface DriverKpiPillarAttendance {
  name: string;
  weight: number;
  score: number;
  working_days_present: number;
  scheduled_days: number;
  attendance_ratio: number;
  attendance_score: number;
  on_time_days: number;
  late_days: number;
  on_time_ratio: number;
  on_time_score: number;
}

export interface DriverKpiPillarOperations {
  name: string;
  weight: number;
  score: number;
  inspection_ratio: number;
  inspection_score: number;
  days_hit_2_inspections: number;
  delivery_ratio: number;
  delivery_score: number;
  total_balls: number;
  target_balls: number;
}

export interface DriverKpiPillarCustomers {
  name: string;
  weight: number;
  score: number;
  cards_achieved: number;
  cards_target: number;
  cards_ratio: number;
  customer_score: number;
}

export interface DriverKpiSummary {
  total_score: number;
  grade: string;
  grade_label: string;
  kpi_bonus: number;
  max_kpi_bonus: number;
  bonus_percentage: number;
  pillar_attendance: DriverKpiPillarAttendance;
  pillar_operations: DriverKpiPillarOperations;
  pillar_customers: DriverKpiPillarCustomers;
}

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

  // KPI Bonus & Terpadu Driver (Baru)
  kpi_bonus?: number;
  kpi_summary?: DriverKpiSummary | null;
  is_closing_period?: boolean;

  // KPI Pengiriman Bulan Ini (Baru)
  delivery_kpi?: DeliveryKpiSummary | null;

  // KPI Operasional Inspeksi Armada (Baru)
  inspection_kpi?: InspectionKpiSummary | null;

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
