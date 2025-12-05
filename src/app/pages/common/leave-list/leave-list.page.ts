import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, NavController, AlertController } from '@ionic/angular';

// Impor Service dan Komponen
import { LeaveService } from 'src/app/services/leave'; 
import { AuthService } from 'src/app/services/auth';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-leave-list',
  templateUrl: './leave-list.page.html',
  styleUrls: ['./leave-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class LeaveListPage implements OnInit {

  // Data dari API
  leaveData: any = null;
  isLoading = true;
  userRole: string = '';

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    // Ambil role user untuk keperluan navigasi/tampilan
    const user = this.authService.getCurrentUserValue();
    this.userRole = user?.role.slug || '';
  }

  // Gunakan ionViewWillEnter agar data di-refresh setiap kali halaman dibuka
  ionViewWillEnter() {
    this.loadLeaveData();
  }

  /**
   * Mengambil data cuti dari API
   */
  async loadLeaveData(event?: any) {
    this.leaveService.getLeaveData().subscribe({
      next: (response) => {
        this.leaveData = response.data;
        this.isLoading = false;
        if (event) event.target.complete(); // Selesaikan refresher
      },
      error: (err) => {
        console.error('Gagal memuat data cuti:', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Navigasi ke halaman Buat Pengajuan
   */
  goToCreate() {
    console.log('🖱️ Navigating to create page');
    // Arahkan ke rute global (di luar tabs)
    this.navCtrl.navigateForward('/leave-create');
  }

  /**
   * Tampilkan detail pengajuan cuti
   */
  async viewLeaveDetail(request: any) {
    console.log('👁️ Viewing leave detail:', request);
    
    const alert = await this.alertCtrl.create({
      header: request.type,
      message: `
        <strong>Status:</strong> ${this.getStatusLabel(request.status)}<br>
        <strong>Tanggal:</strong> ${this.formatDisplayDate(request.start_date)} - ${this.formatDisplayDate(request.end_date)}<br>
        <strong>Alasan:</strong> ${request.reason}<br>
        ${request.status === 'rejected' && request.rejection_reason ? `<br><strong style="color: var(--ion-color-danger);">Alasan Ditolak:</strong> ${request.rejection_reason}` : ''}
      `,
      buttons: ['Tutup']
    });

    await alert.present();
  }

  /**
   * Format tanggal untuk display (DD/MM/YYYY)
   */
  formatDisplayDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Helper untuk warna badge status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Menunggu';
    }
  }
}