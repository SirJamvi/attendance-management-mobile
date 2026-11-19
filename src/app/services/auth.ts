import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import { Storage } from './storage';
import { AuthResponse, User, ApiResponse } from '../types/api.types';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authState = new BehaviorSubject<boolean | null>(null);
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(private apiClient: ApiClient, private storage: Storage) {
    this.apiClient.unauthorized$.subscribe(() => {
      this.currentUser.next(null);
      this.authState.next(false);
    });
    this.loadToken();
  }

  async loadToken(): Promise<void> {
    const token = await this.storage.getToken();

    if (!token) {
      this.currentUser.next(null);
      this.authState.next(false);
      return;
    }

    // Instant Startup: Hydrate from storage cache immediately
    const cachedUser = await this.storage.getUser();
    if (cachedUser) {
      if (this.isWebOnlyRole(cachedUser.role)) {
        await this.storage.clearSession();
        this.currentUser.next(null);
        this.authState.next(false);
        return;
      }
      this.currentUser.next(cachedUser);
      // Unblock app navigation instantly (<50ms) without waiting for network round-trip!
      this.authState.next(true);

      // Verify and update profile in the background silently
      this.refreshUserProfile().catch(() => {});
      return;
    }

    // If no cached user yet (fresh install/update), fetch from server
    try {
      const response = await firstValueFrom(
        this.apiClient.get<ApiResponse<User>>('user')
      );

      if (response && response.success && response.data) {
        if (this.isWebOnlyRole(response.data.role)) {
          await this.storage.clearSession();
          this.currentUser.next(null);
          this.authState.next(false);
          return;
        }

        await this.storage.saveUser(response.data);
        this.currentUser.next(response.data);
        this.authState.next(true);
      } else {
        throw new Error('Token tidak valid');
      }
    } catch (error: any) {
      console.warn('⚠️ Token tidak valid atau gagal verifikasi:', error);
      await this.storage.clearSession();
      this.currentUser.next(null);
      this.authState.next(false);
    }
  }

  login(username: string, password: string, fcmToken?: string): Observable<ApiResponse<AuthResponse>> {
    const payload: Record<string, any> = {
      username,
      password,
      device_name: 'ionic-angular-device',
    };
    if (fcmToken) {
      payload['fcm_token'] = fcmToken;
    }

    return this.apiClient.post<ApiResponse<AuthResponse>>('login', payload).pipe(
      switchMap(async (response) => {
        if (response.success && response.data?.token && response.data?.user) {
          await this.persistSession(response.data.token, response.data.user);
        }
        return response;
      })
    );
  }

  loginWithGoogle(idToken: string, fcmToken?: string): Observable<ApiResponse<AuthResponse>> {
    const payload: Record<string, any> = {
      id_token: idToken,
      device_name: 'ionic-angular-device',
    };
    if (fcmToken) {
      payload['fcm_token'] = fcmToken;
    }

    return this.apiClient.post<ApiResponse<AuthResponse>>('auth/google', payload).pipe(
      switchMap(async (response) => {
        if (response.success && response.data?.token && response.data?.user) {
          await this.persistSession(response.data.token, response.data.user);
        }
        return response;
      })
    );
  }

  private async persistSession(token: string, user: User): Promise<void> {
    await this.storage.saveToken(token);
    await this.storage.saveUser(user);
    this.currentUser.next(user);
    this.authState.next(true);
  }

  async refreshUserProfile(): Promise<User | null> {
    try {
      const response = await firstValueFrom(
        this.apiClient.get<ApiResponse<User>>('user')
      );
      if (response?.success && response.data) {
        if (this.isWebOnlyRole(response.data.role)) {
          await this.logout();
          return null;
        }
        await this.storage.saveUser(response.data);
        this.currentUser.next(response.data);
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.apiClient.post('logout', {}));
    } catch (error) {
      console.warn('⚠️ Gagal logout di server, tetap logout lokal:', error);
    }

    await this.storage.clearSession();
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

  getBranchName(): string {
    return this.currentUser.value?.branch_name || '';
  }

  isLoggedIn(): boolean {
    return this.authState.value === true;
  }

  isKoRole(role?: string | null): boolean {
    return role === 'ko' || role === 'kasir';
  }

  isWebOnlyRole(role?: string | null): boolean {
    return role === 'owner' || role === 'admin';
  }

  getDefaultRouteForRole(role?: string | null): string {
    if (this.isKoRole(role)) {
      return '/tabs/ko';
    }
    if (role === 'driver') {
      return '/tabs/driver';
    }
    if (role === 'sales') {
      return '/tabs/sales';
    }
    return '/login';
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = await this.storage.getToken();
    if (!token) {
      return false;
    }

    try {
      const response = await firstValueFrom(
        this.apiClient.get<ApiResponse<User>>('user')
      );
      return response?.success === true;
    } catch {
      return false;
    }
  }

  getAuthStateValue(): boolean | null {
    return this.authState.value;
  }
}
