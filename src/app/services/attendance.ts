import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiClient } from './api-client';
import {
  Attendance as AttendanceData,
  ApiResponse,
  AttendanceStatusMeta,
  CheckoutEligibility,
  OperationalShift,
  ShiftsResponseData,
} from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private checkoutEligibilitySubject = new BehaviorSubject<CheckoutEligibility | null>(null);
  public readonly checkoutEligibility$ = this.checkoutEligibilitySubject.asObservable();

  private dutyShiftSubject = new BehaviorSubject<{
    id: number;
    name: string;
    isMatch: boolean;
    note?: string;
  } | null>(null);
  public readonly dutyShift$ = this.dutyShiftSubject.asObservable();

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

  setDutyShift(shift: { id: number; name: string; isMatch: boolean; note?: string } | null) {
    this.dutyShiftSubject.next(shift);
  }

  getDutyShiftValue() {
    return this.dutyShiftSubject.value;
  }

  getShifts() {
    return this.apiClient.get<ApiResponse<ShiftsResponseData>>('attendance/shifts');
  }

  updateDutyShift(shiftId: number, note?: string) {
    const body: Record<string, any> = { shift_id: shiftId };
    if (note && note.trim()) {
      body['note'] = note.trim();
    }
    return this.apiClient.post<ApiResponse<any>>('attendance/duty-shift', body).pipe(
      tap((res) => {
        if (res?.data) {
          this.setDutyShift({
            id: res.data.shift_id,
            name: res.data.shift_name,
            isMatch: !!res.data.is_match,
            note: res.data.note,
          });
        }
      })
    );
  }

  checkIn(
    photoBase64: string,
    latitude: number,
    longitude: number,
    emergencyNote?: string,
    branchId?: number | null,
    shiftId?: number | null
  ) {
    const body: Record<string, any> = {
      photo: photoBase64,
      latitude,
      longitude,
    };
    if (emergencyNote && emergencyNote.trim()) {
      body['emergency_note'] = emergencyNote.trim();
    }
    if (branchId) {
      body['branch_id'] = branchId;
    }
    if (shiftId) {
      body['shift_id'] = shiftId;
    }
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-in', body);
  }

  updateDutyBranch(branchId: number) {
    return this.apiClient.post<ApiResponse<any>>('attendance/duty-branch', { branch_id: branchId });
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
