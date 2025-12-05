import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { Storage } from './storage';
import { AuthResponse, User, ApiResponse } from '../types/api.types';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authState = new BehaviorSubject<boolean | null>(null);
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(private apiClient: ApiClient, private storage: Storage) {
    this.loadToken();
  }

  async loadToken() {
    const token = await this.storage.getToken();
    if (token) {
      try {
        const response = await this.apiClient.get<ApiResponse<User>>('user').toPromise();
        if (response && response.success) {
          this.currentUser.next(response.data);
          this.authState.next(true);
        } else {
          throw new Error('Token tidak valid');
        }
      } catch (error) {
        await this.storage.removeToken();
        this.authState.next(false);
      }
    } else {
      this.authState.next(false);
    }
  }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    const device_name = 'ionic-angular-device';
    
    return this.apiClient.post<ApiResponse<AuthResponse>>('login', {
        username,
        password,
        device_name,
      })
      .pipe(
        tap(async (response) => {
          if (response.success) {
            await this.storage.saveToken(response.data.token);
            this.currentUser.next(response.data.user);
            this.authState.next(true);
          }
        })
      );
  }

  async logout() {
    try {
      await this.apiClient.post('logout', {}).toPromise();
    } catch (error) {
      console.error('Gagal logout di server, tapi tetap logout lokal:', error);
    }
    
    await this.storage.removeToken();
    this.currentUser.next(null);
    this.authState.next(false);
  }

  getAuthState(): Observable<boolean | null> {
    return this.authState.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  /**
   * Method untuk mendapatkan current user value secara synchronous
   * Dibutuhkan oleh guard dan home.page.ts
   */
  getCurrentUserValue(): User | null {
    return this.currentUser.value;
  }

  // ✅ TAMBAHKAN METHOD INI
  /**
   * Check apakah user sudah login (synchronous)
   * @returns true jika user sudah login, false jika belum
   */
  isLoggedIn(): boolean {
    return this.authState.value === true;
  }

  // ✅ OPTIONAL: Method async untuk check token validity
  /**
   * Check apakah user sudah login dengan validate token (asynchronous)
   * @returns Promise<boolean>
   */
  async checkAuthStatus(): Promise<boolean> {
    const token = await this.storage.getToken();
    if (!token) {
      return false;
    }
    
    try {
      const response = await this.apiClient.get<ApiResponse<User>>('user').toPromise();
      return response?.success === true;
    } catch (error) {
      return false;
    }
  }

  // ✅ OPTIONAL: Method untuk get auth state value (synchronous)
  /**
   * Get current auth state value
   * @returns boolean | null
   */
  getAuthStateValue(): boolean | null {
    return this.authState.value;
  }
}