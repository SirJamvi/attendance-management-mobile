import { Injectable, inject } from '@angular/core';
import { Platform, AlertController, ToastController } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { ApiClient } from './api-client';
import { firstValueFrom } from 'rxjs';

export interface AppUpdateCheckResponse {
  update_available: boolean;
  version: string;
  url?: string;
  checksum?: string;
  force_native_update?: boolean;
  min_native_version?: string;
  playstore_url?: string;
  release_notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtaUpdateService {
  private platform = inject(Platform);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private apiClient = inject(ApiClient);

  private isChecking = false;
  private currentVersion = 'builtin';

  /**
   * Inisialisasi OTA Update saat aplikasi dibuka
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('ℹ️ [OTA] Berjalan di browser / Web platform. OTA update dinonaktifkan.');
      return;
    }

    try {
      // 1. Beritahukan plugin bahwa bundle saat ini sukses dimuat & stabil (mencegah rollback otomatis)
      await CapacitorUpdater.notifyAppReady();

      // 2. Dapatkan versi aktif saat ini
      const current = await CapacitorUpdater.current();
      this.currentVersion = current?.bundle?.version || current?.native || 'builtin';
      console.log(`🚀 [OTA] Versi bundle aktif saat ini: ${this.currentVersion}`);

      // 3. Cek apakah ada update baru dari server backend
      await this.checkForUpdate();
    } catch (err) {
      console.warn('⚠️ [OTA] Gagal inisialisasi CapacitorUpdater:', err);
    }
  }

  /**
   * Memeriksa pembaruan ke backend
   */
  async checkForUpdate(showNoUpdateToast = false): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.isChecking) {
      return;
    }

    this.isChecking = true;

    try {
      const platformName = this.platform.is('ios') ? 'ios' : 'android';
      const response = await firstValueFrom(
        this.apiClient.get<{ success: boolean; data: AppUpdateCheckResponse }>('/app/check-update', {
          current_version: this.currentVersion,
          platform: platformName
        })
      );

      const updateData = response?.data;
      if (!updateData) {
        return;
      }

      // Skenario A: Wajib update aplikasi native via Play Store / APK
      if (updateData.force_native_update) {
        await this.showForceNativeUpdateAlert(updateData);
        return;
      }

      // Skenario B: Ada live update OTA (bundle web)
      if (updateData.update_available && updateData.url && updateData.version !== this.currentVersion) {
        await this.downloadAndApplyOta(updateData);
        return;
      }

      if (showNoUpdateToast) {
        const toast = await this.toastCtrl.create({
          message: 'Aplikasi sudah menggunakan versi terbaru.',
          duration: 2500,
          position: 'bottom',
          color: 'medium'
        });
        await toast.present();
      }
    } catch (err) {
      console.warn('⚠️ [OTA] Gagal mengecek update ke server:', err);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Mengunduh dan menyiapkan bundle OTA di latar belakang
   */
  private async downloadAndApplyOta(updateData: AppUpdateCheckResponse): Promise<void> {
    console.log(`⬇️ [OTA] Memulai unduhan bundle baru v${updateData.version} dari: ${updateData.url}`);

    try {
      const downloadResult = await CapacitorUpdater.download({
        url: updateData.url!,
        version: updateData.version,
        checksum: updateData.checksum
      });

      // Tetapkan versi baru agar aktif di latar belakang saat aplikasi dibuka berikutnya
      await CapacitorUpdater.next({ id: downloadResult.id });
      console.log(`✅ [OTA] Bundle v${updateData.version} berhasil diunduh dan disiapkan sebagai update berikutnya.`);

      // Tampilkan notifikasi toast ramah kepada pengguna
      const notes = updateData.release_notes ? `\nCatatan: ${updateData.release_notes}` : '';
      const toast = await this.toastCtrl.create({
        header: '✨ Pembaruan Siap',
        message: `Pembaruan fitur baru (v${updateData.version}) telah selesai diunduh.${notes}`,
        duration: 8000,
        position: 'top',
        color: 'success',
        buttons: [
          {
            text: 'Muat Ulang Sekarang',
            role: 'info',
            handler: () => {
              CapacitorUpdater.reload();
            }
          },
          {
            text: 'Nanti',
            role: 'cancel'
          }
        ]
      });

      await toast.present();
    } catch (err) {
      console.error('❌ [OTA] Gagal mengunduh atau mengaplikasikan bundle OTA:', err);
    }
  }

  /**
   * Menampilkan modal peringatan jika wajib update via Play Store (Major Release)
   */
  private async showForceNativeUpdateAlert(updateData: AppUpdateCheckResponse): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Pembaruan Aplikasi Wajib',
      backdropDismiss: false,
      message: updateData.release_notes || 'Tersedia versi baru aplikasi dengan fitur besar. Silakan perbarui aplikasi untuk melanjutkan operasional.',
      buttons: [
        {
          text: 'Perbarui Sekarang',
          handler: () => {
            const playstoreUrl = updateData.playstore_url || 'https://attendance.eskristalkarawang.com';
            window.open(playstoreUrl, '_system');
            return false; // Tetap di modal jika belum update
          }
        }
      ]
    });

    await alert.present();
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }
}
