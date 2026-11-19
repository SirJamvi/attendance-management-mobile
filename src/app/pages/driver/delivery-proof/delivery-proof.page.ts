import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, NavController } from '@ionic/angular';
import { DeliveryService } from 'src/app/services/delivery';

// Plugin Capacitor untuk Kamera & GPS
import { CameraDirection } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { captureCompressedPhoto } from 'src/app/utils/image-compressor';

@Component({
  selector: 'app-delivery-proof',
  templateUrl: './delivery-proof.page.html',
  styleUrls: ['./delivery-proof.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DeliveryProofPage {
  private deliveryService = inject(DeliveryService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  // Model Data sesuai parameter Backend
  formData = {
    butterfly_customer_name: '',
    qty_20kg: 0,
    qty_b_half: 0,
    qty_half: 0, // Prioritas penjualan bal 10-12kg
    payment_method: 'Cash',
    payment_note: '',
    latitude: '',
    longitude: '',
    proof_image: ''
  };

  previewImage: string | undefined;

  constructor() {}

  // 1. Ambil Titik Koordinat Lokasi
  async getLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.formData.latitude = position.coords.latitude.toString();
      this.formData.longitude = position.coords.longitude.toString();
    } catch (error) {
      console.error('Gagal mengambil lokasi GPS', error);
      this.showToast('Gagal mendapatkan lokasi GPS. Pastikan izin lokasi aktif.', 'danger');
    }
  }

  // 2. Buka Kamera dan Ambil Foto Base64 terkompresi (max 1280px, quality 75%)
  async takePicture() {
    try {
      const compressed = await captureCompressedPhoto({
        direction: CameraDirection.Rear,
        maxWidth: 1280,
        quality: 0.75,
        promptHeader: 'Ambil Bukti Pengiriman',
      });

      if (compressed) {
        this.previewImage = compressed;
        this.formData.proof_image = compressed;

        // Ambil GPS secara diam-diam setelah foto diambil
        this.getLocation();
      }
    } catch (error) {
      console.error('Kamera dibatalkan / error', error);
    }
  }

  // 3. Kirim Data ke Backend
  async submitDelivery() {
    // Validasi Sederhana
    if (!this.formData.butterfly_customer_name) {
      return this.showToast('Nama warung/pelanggan wajib diisi!', 'warning');
    }
    if (this.formData.qty_half === 0 && this.formData.qty_20kg === 0 && this.formData.qty_b_half === 0) {
      return this.showToast('Masukkan minimal 1 bal es yang dikirim!', 'warning');
    }
    if (!this.formData.proof_image) {
      return this.showToast('Bukti foto wajib dilampirkan!', 'warning');
    }

    const loading = await this.loadingCtrl.create({
      message: 'Mengirim bukti pengiriman...',
      spinner: 'crescent'
    });
    await loading.present();

    this.deliveryService.submitDeliveryProof(this.formData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.status === 'success') {
          this.showToast('Bukti berhasil dikirim! Menunggu validasi admin.', 'success');
          // Kembali ke halaman sebelumnya setelah sukses
          this.navCtrl.back();
        } else {
          this.showToast(res.message || 'Terjadi kesalahan sistem', 'danger');
        }
      },
      error: async (err: any) => {
        await loading.dismiss();
        console.error('Error submit:', err);
        this.showToast('Gagal terhubung ke server', 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}