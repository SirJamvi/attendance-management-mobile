import { Injectable } from '@angular/core';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { User } from '../types/api.types';

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private _storage: IonicStorage | null = null;
  
  // ✅ KUNCI PERBAIKAN: Kita simpan proses inisialisasi sebagai Promise
  private _storagePromise: Promise<IonicStorage>;

  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly AUTH_USER_KEY  = 'auth_user';

  constructor(private storage: IonicStorage) {
    // ✅ Jalankan init() dan simpan status "menunggu"-nya
    this._storagePromise = this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    console.log('✅ Ionic Storage initialized');
    return storage;
  }

  public async set(key: string, value: any) {
    const store = await this._storagePromise; // ✅ Tunggu sampai storage benar-benar siap!
    await store.set(key, value);
    console.log(`💾 Storage SET: ${key}`);
  }

  public async get(key: string) {
    const store = await this._storagePromise; // ✅ Tunggu sampai storage benar-benar siap!
    const value = await store.get(key);
    console.log(`📦 Storage GET: ${key} =`, value ? 'ADA' : 'TIDAK ADA');
    return value;
  }

  public async remove(key: string) {
    const store = await this._storagePromise; // ✅ Tunggu sampai storage benar-benar siap!
    await store.remove(key);
    console.log(`🗑️ Storage REMOVE: ${key}`);
  }

  // ── TOKEN ──────────────────────────────────────────────────────────

  public async saveToken(token: string) {
    await this.set(this.AUTH_TOKEN_KEY, token);
    console.log('✅ Token disimpan dengan key:', this.AUTH_TOKEN_KEY);
  }

  public async getToken(): Promise<string | null> {
    const token = await this.get(this.AUTH_TOKEN_KEY);
    if (token) {
      console.log('🔑 Token ditemukan:', token.substring(0, 30) + '...');
    } else {
      console.log('⚠️ Token TIDAK ditemukan!');
    }
    return token ?? null;
  }

  public async removeToken() {
    await this.remove(this.AUTH_TOKEN_KEY);
    console.log('🗑️ Token dihapus');
  }

  // ── USER CACHE ─────────────────────────────────────────────────────

  public async saveUser(user: User) {
    await this.set(this.AUTH_USER_KEY, JSON.stringify(user));
    console.log('✅ User cache disimpan:', user.name);
  }

  public async getUser(): Promise<User | null> {
    const raw = await this.get(this.AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      console.warn('⚠️ Gagal parse user cache');
      return null;
    }
  }

  public async removeUser() {
    await this.remove(this.AUTH_USER_KEY);
    console.log('🗑️ User cache dihapus');
  }
}