import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  constructor(private apiClient: ApiClient) {}

  getLeaveData() {
    return this.apiClient.get<ApiResponse<any>>('leave');
  }

  submitLeave(formData: FormData) {
    return this.apiClient.post<ApiResponse<any>>('leave', formData);
  }
}