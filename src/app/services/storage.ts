import { Injectable } from '@angular/core';
import { Storage as IonicStorage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private _storage: IonicStorage | null = null;
  // ✅ GUNAKAN KEY YANG KONSISTEN
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  constructor(private storage: IonicStorage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    console.log('✅ Ionic Storage initialized');
  }

  public async set(key: string, value: any) {
    await this._storage?.set(key, value);
    console.log(`💾 Storage SET: ${key}`);
  }

  public async get(key: string) {
    const value = await this._storage?.get(key);
    console.log(`📦 Storage GET: ${key} =`, value ? 'ADA' : 'TIDAK ADA');
    return value;
  }

  public async remove(key: string) {
    await this._storage?.remove(key);
    console.log(`🗑️ Storage REMOVE: ${key}`);
  }

  // --- Helper khusus untuk Token Auth ---
  public async saveToken(token: string) {
    await this.set(this.AUTH_TOKEN_KEY, token);
    console.log('✅ Token disimpan dengan key:', this.AUTH_TOKEN_KEY);
  }

  public async getToken() {
    const token = await this.get(this.AUTH_TOKEN_KEY);
    if (token) {
      console.log('🔑 Token ditemukan:', token.substring(0, 30) + '...');
    } else {
      console.log('⚠️ Token TIDAK ditemukan!');
    }
    return token;
  }

  public async removeToken() {
    await this.remove(this.AUTH_TOKEN_KEY);
    console.log('🗑️ Token dihapus');
  }
}