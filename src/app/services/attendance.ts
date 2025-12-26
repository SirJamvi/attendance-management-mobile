import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { Attendance as AttendanceData, ApiResponse } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  constructor(private apiClient: ApiClient) {}

  getStatus() {
    return this.apiClient.get<ApiResponse<AttendanceData | null>>('attendance/status');
  }

  checkIn(photoBase64: string, latitude: number, longitude: number) {
    const body = {
      photo: photoBase64,
      latitude: latitude,
      longitude: longitude,
    };
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-in', body);
  }

  checkOut(photoBase64: string, latitude: number, longitude: number) {
    const body = {
      photo: photoBase64,
      latitude: latitude,
      longitude: longitude,
    };
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-out', body);
  }

  getHistory(startDate?: string, endDate?: string) {
    let url = 'driver/history';
    
    const params: string[] = [];
    if (startDate) params.push(`start_date=${startDate}`);
    if (endDate) params.push(`end_date=${endDate}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.apiClient.get<any>(url);
  }
}