import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, NavController } from '@ionic/angular';

// Impor komponen dan service kita
import { CameraViewComponent } from 'src/app/components/camera-view/camera-view.component';
import { LeaveService } from 'src/app/services/leave'; // (Pastikan nama file benar: leave.ts)
import { AuthService } from 'src/app/services/auth'; // Untuk cek role saat redirect
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-leave-create',
  templateUrl: './leave-create.page.html',
  styleUrls: ['./leave-create.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    FormsModule,
    CameraViewComponent,
    LoadingSpinnerComponent
  ]
})
export class LeaveCreatePage implements OnInit {

  // Model Form
  leaveType: string = '';
  startDate: string = '';
  endDate: string = '';
  reason: string = '';
  attachmentBase64: string | null = null;

  // State UI
  isSubmitting = false;
  
  // Opsi Tipe Cuti (Sesuai SOP)
  leaveTypes = [
    { value: 'Tahunan', label: 'Cuti Tahunan' },
    { value: 'Sakit', label: 'Sakit (Wajib Surat Dokter)' },
    { value: 'Izin', label: 'Izin Khusus' }
  ];

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    // Set default tanggal hari ini
    const today = new Date().toISOString();
    this.startDate = today;
    this.endDate = today;
  }

  /**
   * Menangani foto yang diambil dari komponen kamera
   */
  handleAttachment(photoBase64: string | null) {
    this.attachmentBase64 = photoBase64;
  }

  /**
   * Validasi dan Submit Form
   */
  async onSubmit() {
    // 1. Validasi Input Dasar
    if (!this.leaveType || !this.startDate || !this.endDate || !this.reason) {
      this.showAlert('Gagal', 'Mohon lengkapi semua kolom yang wajib diisi.');
      return;
    }

    // 2. Validasi Khusus: Cuti Sakit WAJIB ada lampiran
    if (this.leaveType === 'Sakit' && !this.attachmentBase64) {
      this.showAlert('Gagal', 'Untuk cuti sakit, Anda wajib melampirkan foto surat dokter.');
      return;
    }

    // 3. Konversi Base64 ke Blob/File (karena API butuh file upload)
    const formData = new FormData();
    formData.append('type', this.leaveType);
    // Potong string ISO date agar sesuai format YYYY-MM-DD
    formData.append('start_date', this.startDate.split('T')[0]); 
    formData.append('end_date', this.endDate.split('T')[0]);
    formData.append('reason', this.reason);

    if (this.attachmentBase64) {
      const blob = this.base64ToBlob(this.attachmentBase64);
      // Nama file harus ada ekstensinya (.jpg)
      formData.append('attachment', blob, 'surat-dokter.jpg'); 
    }

    // 4. Kirim ke API
    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim pengajuan...' });
    await loading.present();

    this.leaveService.submitLeave(formData).subscribe({
      next: async (response) => {
        loading.dismiss();
        this.isSubmitting = false;
        await this.showAlert('Berhasil', 'Pengajuan cuti berhasil dikirim.');
        this.goBack();
      },
      error: (err) => {
        loading.dismiss();
        this.isSubmitting = false;
        console.error('Error submit leave:', err);
        const msg = err.error?.message || 'Gagal mengirim pengajuan. Silakan coba lagi.';
        this.showAlert('Gagal', msg);
      }
    });
  }

  /**
   * Helper: Navigasi kembali sesuai role
   */
  goBack() {
    const user = this.authService.getCurrentUserValue();
    if (user?.role.slug === 'driver') {
      this.navCtrl.navigateBack('/tabs/driver/leave');
    } else if (user?.role.slug === 'sales') {
      this.navCtrl.navigateBack('/tabs/sales/leave');
    } else {
      this.navCtrl.navigateBack('/tabs');
    }
  }

  /**
   * Helper: Tampilkan Alert
   */
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * Utility: Convert Base64 to Blob (untuk upload file via FormData)
   */
  base64ToBlob(base64: string): Blob {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}