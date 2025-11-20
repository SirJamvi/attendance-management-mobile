import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
// PERBAIKAN: Ganti nama class menjadi 'LeaveService'
export class LeaveService {
  constructor(private apiClient: ApiClient) {}

  getLeaveData() {
    return this.apiClient.get<ApiResponse<any>>('leave');
  }

  submitLeave(formData: FormData) {
    return this.apiClient.postWithFile<ApiResponse<any>>('leave', formData);
  }
}