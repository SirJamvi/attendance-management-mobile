import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { Attendance as AttendanceData, ApiResponse } from '../types/api.types';
import { HttpParams } from '@angular/common/http'; // <-- Tambahkan ini

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  constructor(private apiClient: ApiClient) {}

  // Mengambil status presensi hari ini
  getStatus() {
    return this.apiClient.get<ApiResponse<AttendanceData | null>>('attendance/status');
  }

  // Mengirim data check-in
  checkIn(photoBase64: string, latitude: number, longitude: number) {
    const body = {
      photo: photoBase64,
      latitude: latitude,
      longitude: longitude,
    };
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-in', body);
  }

  // Mengirim data check-out
  checkOut(photoBase64: string, latitude: number, longitude: number) {
    const body = {
      photo: photoBase64,
      latitude: latitude,
      longitude: longitude,
    };
    return this.apiClient.post<ApiResponse<AttendanceData>>('attendance/check-out', body);
  }

  // --- TAMBAHAN BARU: GET HISTORY ---
  getHistory(startDate?: string, endDate?: string) {
    let params: { [key: string]: string } = {};

    if (startDate) params['start_date'] = startDate;
    if (endDate) params['end_date'] = endDate;

    // Kirim request ke endpoint khusus driver
    return this.apiClient.get<ApiResponse<any>>('driver/history', new HttpParams({ fromObject: params }));
  }
}