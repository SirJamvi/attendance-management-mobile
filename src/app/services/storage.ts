import { Injectable } from '@angular/core';
// 1. Impor Ionic Storage
import { Storage as IonicStorage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private _storage: IonicStorage | null = null;
  private readonly AUTH_TOKEN_KEY = '_my_token'; // Kunci untuk menyimpan token

  constructor(private storage: IonicStorage) {
    // Panggil init() saat service dibuat
    this.init();
  }

  // 2. Inisialisasi driver storage
  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // 3. Simpan nilai (misal: token)
  public async set(key: string, value: any) {
    await this._storage?.set(key, value);
  }

  // 4. Ambil nilai (misal: token)
  public async get(key: string) {
    return await this._storage?.get(key);
  }

  // 5. Hapus nilai
  public async remove(key: string) {
    await this._storage?.remove(key);
  }

  // --- Helper khusus untuk Token Auth ---

  public async saveToken(token: string) {
    await this.set(this.AUTH_TOKEN_KEY, token);
  }

  public async getToken() {
    return await this.get(this.AUTH_TOKEN_KEY);
  }

  public async removeToken() {
    await this.remove(this.AUTH_TOKEN_KEY);
  }
}