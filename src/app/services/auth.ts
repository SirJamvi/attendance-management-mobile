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

  /**
   * Dipanggil saat app pertama kali dibuka.
   *
   * ALUR BARU (Persistent Login):
   * 1. Cek token di storage lokal
   * 2. Jika ada → langsung restore user dari CACHE LOKAL (tanpa tunggu server)
   *    sehingga user tidak perlu login ulang meski offline
   * 3. Validasi token ke server berjalan di BACKGROUND secara non-blocking
   * 4. Jika server tolak dengan 401 → baru logout
   * 5. Jika gagal karena network/timeout → SESSION DIPERTAHANKAN
   */
  async loadToken() {
    console.log('🔄 AuthService: Loading token...');
    const token = await this.storage.getToken();

    if (!token) {
      console.log('⚠️ Token tidak ditemukan, perlu login.');
      this.authState.next(false);
      return;
    }

    console.log('✅ Token ditemukan, mencoba restore session...');

    // LANGKAH 1: Restore dari cache lokal dulu — user langsung masuk
    const cachedUser = await this.storage.getUser();
    if (cachedUser) {
      console.log('✅ Session restored dari cache lokal:', cachedUser.name);
      this.currentUser.next(cachedUser);
      this.authState.next(true); // ← User dianggap sudah login
    }

    // LANGKAH 2: Validasi ke server di background (tidak memblokir UI)
    this.validateTokenInBackground();
  }

  /**
   * Validasi token ke server secara background.
   *
   * ✅ Sukses (200)         → update data user & cache
   * ❌ Ditolak (401)        → token tidak valid → paksa logout
   * 🌐 Network error/timeout → BIARKAN, jangan hapus session
   */
  private async validateTokenInBackground() {
    try {
      const response = await this.apiClient.get<ApiResponse<User>>('user').toPromise();

      if (response && response.success) {
        console.log('✅ Token valid, update user dari server:', response.data.name);
        console.log('👤 User data loaded:', response.data);
        console.log('🔑 User role:', response.data.role);

        // Update state & simpan user terbaru ke cache
        this.currentUser.next(response.data);
        this.authState.next(true);
        await this.storage.saveUser(response.data);
      } else {
        // Response ada tapi tidak sukses → logout
        console.warn('⚠️ Token ditolak server, logout...');
        await this.clearSession();
      }

    } catch (error: any) {
      // Bedakan error 401 (token invalid) vs error jaringan
      const httpStatus = error?.status;

      if (httpStatus === 401) {
        // Token benar-benar tidak valid di server → wajib logout
        console.error('❌ Token invalid (401), paksa logout.');
        await this.clearSession();
      } else {
        // Offline / timeout / server error 5xx → pertahankan session
        console.warn(`🌐 Gagal validasi (status: ${httpStatus ?? 'network error'}), session dipertahankan.`);
      }
    }
  }

  login(username: string, password: string): Observable<ApiResponse<AuthResponse>> {
    const device_name = 'ionic-angular-device';

    console.log('🔐 Login attempt:', { username, device_name });

    return this.apiClient
      .post<ApiResponse<AuthResponse>>('login', { username, password, device_name })
      .pipe(
        tap(async (response) => {
          console.log('📥 Login response:', response);

          if (response.success) {
            console.log('✅ Login berhasil!');
            console.log('🔑 Token received:', response.data.token.substring(0, 30) + '...');
            console.log('👤 User data from login:', response.data.user);
            console.log('🔑 User role type:', typeof response.data.user.role);
            console.log('🔑 User role value:', response.data.user.role);

            // Simpan token ke storage
            await this.storage.saveToken(response.data.token);
            console.log('💾 Token disimpan ke storage');

            // Simpan user ke cache lokal
            await this.storage.saveUser(response.data.user);
            console.log('💾 User cache disimpan');

            // Verify token tersimpan
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
      console.warn('⚠️ Gagal logout di server, tetap logout lokal:', error);
    }
    await this.clearSession();
  }

  /**
   * Hapus semua data session lokal
   */
  private async clearSession() {
    await this.storage.removeToken();
    await this.storage.removeUser(); // ← Hapus cache user juga
    console.log('🗑️ Session dihapus (token + user cache)');
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
    if (!token) return false;

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