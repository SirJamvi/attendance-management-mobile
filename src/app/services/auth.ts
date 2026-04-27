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
    console.log('🔄 AuthService: Loading token...');
    const token = await this.storage.getToken();
    
    if (token) {
      console.log('✅ Token ditemukan:', token.substring(0, 30) + '...');
      try {
        const response = await this.apiClient.get<ApiResponse<User>>('user').toPromise();
        if (response && response.success) {
          console.log('✅ User authenticated:', response.data.name);
          console.log('👤 User data loaded:', response.data); // ← DEBUGGING USER DATA
          console.log('🔑 User role type:', typeof response.data.role); // ← CEK TIPE ROLE
          console.log('🔑 User role value:', response.data.role); // ← CEK VALUE ROLE
          
          this.currentUser.next(response.data);
          this.authState.next(true);
        } else {
          throw new Error('Token tidak valid');
        }
      } catch (error) {
        console.error('❌ Token tidak valid, menghapus...');
        await this.storage.removeToken();
        this.authState.next(false);
      }
    } else {
      console.log('⚠️ Token tidak ditemukan');
      this.authState.next(false);
    }
  }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    const device_name = 'ionic-angular-device';
    
    console.log('🔐 Login attempt:', { username, device_name });
    
    return this.apiClient.post<ApiResponse<AuthResponse>>('login', {
        username,
        password,
        device_name,
      })
      .pipe(
        tap(async (response) => {
          console.log('📥 Login response:', response);
          
          if (response.success) {
            console.log('✅ Login berhasil!');
            console.log('🔑 Token received:', response.data.token.substring(0, 30) + '...');
            
            // ✅ DEBUGGING USER DATA DARI LOGIN
            console.log('👤 User data from login:', response.data.user);
            console.log('🔑 User role type from login:', typeof response.data.user.role);
            console.log('🔑 User role value from login:', response.data.user.role);
            
            // SIMPAN TOKEN
            await this.storage.saveToken(response.data.token);
            console.log('💾 Token disimpan ke storage');
            
            // VERIFY TOKEN TERSIMPAN
            const verifyToken = await this.storage.getToken();
            if (verifyToken) {
              console.log('✅ VERIFIED: Token berhasil tersimpan!');
            } else {
              console.error('❌ GAGAL: Token tidak tersimpan!');
            }
            
            this.currentUser.next(response.data.user);
            this.authState.next(true);
          } else {
            console.error('❌ Login gagal:', response.message);
          }
        })
      );
  }

  async logout() {
    console.log('🚪 Logout...');
    try {
      await this.apiClient.post('logout', {}).toPromise();
      console.log('✅ Logout dari server berhasil');
    } catch (error) {
      console.error('⚠️ Gagal logout di server, tapi tetap logout lokal:', error);
    }
    
    await this.storage.removeToken();
    console.log('🗑️ Token dihapus dari storage');
    
    this.currentUser.next(null);
    this.authState.next(false);
  }

  getAuthState(): Observable<boolean | null> {
    return this.authState.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  getCurrentUserValue(): User | null {
    return this.currentUser.value;
  }

  isLoggedIn(): boolean {
    return this.authState.value === true;
  }

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

  getAuthStateValue(): boolean | null {
    return this.authState.value;
  }
}