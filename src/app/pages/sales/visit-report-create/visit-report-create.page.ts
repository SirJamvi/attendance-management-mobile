import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, NavController, Platform } from '@ionic/angular';
import { Geolocation, Position } from '@capacitor/geolocation';

// Impor Service & Komponen
import { SalesReportService } from 'src/app/services/sales-report'; // (Pastikan nama file benar)
import { CameraViewComponent } from 'src/app/components/camera-view/camera-view.component';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-visit-report-create',
  templateUrl: './visit-report-create.page.html',
  styleUrls: ['./visit-report-create.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, CameraViewComponent, LoadingSpinnerComponent]
})
export class VisitReportCreatePage implements OnInit {

  // Model Form
  placeName: string = '';
  address: string = '';
  picName: string = '';
  picPhone: string = '';
  result: string = ''; // 'Presentasi', 'Sign Up', 'Follow Up', 'Ditolak'
  notes: string = '';
  
  // Data Bukti
  photoData: string | null = null;
  locationData: { latitude: number; longitude: number } | null = null;

  // State UI
  isSubmitting = false;

  // Opsi Hasil Kunjungan (Sesuai SOP)
  visitResults = [
    { value: 'Presentasi', label: 'Presentasi (Penjelasan Produk)' },
    { value: 'Sign Up', label: 'Sign Up (Closing)' },
    { value: 'Follow Up', label: 'Follow Up (Perlu Tindak Lanjut)' },
    { value: 'Ditolak', label: 'Ditolak (Prospek Menolak)' }
  ];

  constructor(
    private salesService: SalesReportService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private platform: Platform
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    // Reset form saat halaman dibuka
    this.resetForm();
  }

  /**
   * Menangani foto dari komponen kamera
   */
  async handlePhoto(photoBase64: string | null) {
    this.photoData = photoBase64;

    // Jika foto berhasil diambil, langsung ambil lokasi GPS
    if (this.photoData) {
      await this.getGeolocation();
    } else {
      this.locationData = null;
    }
  }

  /**
   * Mengambil lokasi GPS
   */
  async getGeolocation() {
    try {
      // (Mock lokasi untuk testing di browser)
      if (!this.platform.is('capacitor')) {
        this.locationData = { latitude: -6.3518, longitude: 107.3701 };
        return;
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      this.locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

    } catch (error) {
      console.error('Error GPS', error);
      this.showAlert('Gagal GPS', 'Gagal mengambil lokasi. Pastikan GPS aktif.');
      this.locationData = null;
    }
  }

  /**
   * Validasi dan Submit
   */
  async onSubmit() {
    // 1. Validasi Form
    if (!this.placeName || !this.address || !this.picName || !this.picPhone || !this.result) {
      this.showAlert('Validasi', 'Mohon lengkapi semua data kunjungan.');
      return;
    }

    // 2. Validasi Bukti (Foto & GPS Wajib)
    if (!this.photoData) {
      this.showAlert('Validasi', 'Foto bukti kunjungan wajib diambil.');
      return;
    }
    if (!this.locationData) {
      this.showAlert('Validasi', 'Lokasi GPS wajib terdeteksi.');
      return;
    }

    // 3. Siapkan Data
    const payload = {
      photo: this.photoData,
      latitude: this.locationData.latitude,
      longitude: this.locationData.longitude,
      place_name: this.placeName,
      address: this.address,
      pic_name: this.picName,
      pic_phone: this.picPhone,
      result: this.result,
      notes: this.notes
    };

    // 4. Kirim ke API
    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim laporan...' });
    await loading.present();

    this.salesService.submitVisitReport(payload).subscribe({
      next: async (response) => {
        loading.dismiss();
        this.isSubmitting = false;
        await this.showAlert('Berhasil', 'Laporan kunjungan berhasil disimpan.');
        this.navCtrl.navigateBack('/tabs/sales/dashboard');
      },
      error: (err) => {
        loading.dismiss();
        this.isSubmitting = false;
        console.error('Error submit visit:', err);
        const msg = err.error?.message || 'Gagal menyimpan laporan.';
        this.showAlert('Gagal', msg);
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  resetForm() {
    this.placeName = '';
    this.address = '';
    this.picName = '';
    this.picPhone = '';
    this.result = '';
    this.notes = '';
    this.photoData = null;
    this.locationData = null;
  }
}