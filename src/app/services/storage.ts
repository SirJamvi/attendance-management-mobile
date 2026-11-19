import { Injectable } from '@angular/core';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { User } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private _storage: IonicStorage | null = null;
  private initPromise: Promise<IonicStorage>;
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_DATA_KEY = 'auth_user';

  // In-memory fast cache for instantaneous reads
  private cachedToken: string | null = null;
  private cachedUser: User | null = null;
  private tokenHydrated = false;
  private userHydrated = false;

  constructor(private storage: IonicStorage) {
    this.initPromise = this.init();
  }

  async init(): Promise<IonicStorage> {
    if (this._storage) {
      return this._storage;
    }
    const storage = await this.storage.create();
    this._storage = storage;
    // Preload token and user into in-memory cache
    try {
      this.cachedToken = await storage.get(this.AUTH_TOKEN_KEY);
      this.tokenHydrated = true;
      this.cachedUser = await storage.get(this.USER_DATA_KEY);
      this.userHydrated = true;
    } catch {
      // Ignored if empty
    }
    return storage;
  }

  private async ensureReady(): Promise<IonicStorage> {
    if (!this._storage) {
      await this.initPromise;
    }
    return this._storage!;
  }

  public async set(key: string, value: any): Promise<void> {
    const store = await this.ensureReady();
    await store.set(key, value);
  }

  public async get<T = any>(key: string): Promise<T | null> {
    const store = await this.ensureReady();
    const value = await store.get(key);
    return value ?? null;
  }

  public async remove(key: string): Promise<void> {
    const store = await this.ensureReady();
    await store.remove(key);
  }

  // --- Helper khusus untuk Token Auth ---
  public async saveToken(token: string): Promise<void> {
    this.cachedToken = token;
    this.tokenHydrated = true;
    await this.set(this.AUTH_TOKEN_KEY, token);
  }

  public async getToken(): Promise<string | null> {
    if (this.tokenHydrated) {
      return this.cachedToken;
    }
    const store = await this.ensureReady();
    const token = await store.get(this.AUTH_TOKEN_KEY);
    this.cachedToken = token ?? null;
    this.tokenHydrated = true;
    return this.cachedToken;
  }

  public async removeToken(): Promise<void> {
    this.cachedToken = null;
    this.tokenHydrated = true;
    await this.remove(this.AUTH_TOKEN_KEY);
  }

  // --- Helper khusus untuk Payload User (role, branch_id, branch_name, dll) ---
  public async saveUser(user: User): Promise<void> {
    this.cachedUser = user;
    this.userHydrated = true;
    await this.set(this.USER_DATA_KEY, user);
  }

  public async getUser(): Promise<User | null> {
    if (this.userHydrated) {
      return this.cachedUser;
    }
    const store = await this.ensureReady();
    const user = await store.get(this.USER_DATA_KEY);
    this.cachedUser = user ?? null;
    this.userHydrated = true;
    return this.cachedUser;
  }

  public async removeUser(): Promise<void> {
    this.cachedUser = null;
    this.userHydrated = true;
    await this.remove(this.USER_DATA_KEY);
  }

  public async clearSession(): Promise<void> {
    this.cachedToken = null;
    this.cachedUser = null;
    this.tokenHydrated = true;
    this.userHydrated = true;
    await this.removeToken();
    await this.removeUser();
  }
}
