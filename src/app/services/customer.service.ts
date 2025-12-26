import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { ApiResponse } from '../types/api.types';
import { Customer } from '../types/customer.types'; // Sesuaikan path import

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Mengambil daftar customer
   * Endpoint: /driver/customers
   */
  getCustomers() {
    // ApiClient sudah otomatis inject Token & Base URL
    return this.apiClient.get<ApiResponse<Customer[]>>('driver/customers');
  }
}