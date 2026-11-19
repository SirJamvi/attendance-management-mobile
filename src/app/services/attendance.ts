import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiClient } from './api-client';
import {
  Attendance as AttendanceData,
  ApiResponse,
  AttendanceStatusMeta,
  CheckoutEligibility,
} from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private checkoutEligibilitySubject = new BehaviorSubject<CheckoutEligibility | null>(null);
  public readonly checkoutEligibility$ = this.checkoutEligibilitySubject.asObservable();

  constructor(private apiClient: ApiClient) {}

  getStatus() {
    return this.apiClient
      .get<ApiResponse<AttendanceData | null, AttendanceStatusMeta>>('attendance/status')
      .pipe(
        tap((response) => {
          if (response?.meta && 'checkout_eligibility' in response.meta) {
            this.checkoutEligibilitySubject.next(response.meta.checkout_eligibility ?? null);
          }
        })
      );
  }

  updateCheckoutEligibility(eligibility: CheckoutEligibility | null | undefined) {
    if (eligibility !== undefined) {
      this.checkoutEligibilitySubject.next(eligibility);
    }
  }

  getCheckoutEligibilityValue(): CheckoutEligibility | null {
    return this.checkoutEligibilitySubject.value;
  }

  checkIn(photoBase64: string, latitude: number, longitude: number, emergencyNote?: string) {
    const body: Record<string, any> = {
      photo: photoBase64,
      latitude,
      longitude,
    };
    if (emergencyNote && emergencyNote.trim()) {
      body['emergency_note'] = emergencyNote.trim();
    }
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-in', body);
  }

  checkOut(photoBase64: string, latitude: number, longitude: number) {
    const body = {
      photo: photoBase64,
      latitude,
      longitude,
    };
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-out', body);
  }

  getHistory(startDate?: string, endDate?: string) {
    return this.apiClient.get<any>('driver/history', {
      start_date: startDate,
      end_date: endDate,
    });
  }

  getActiveMissions() {
    return this.apiClient.get<any>('driver/missions');
  }
}
