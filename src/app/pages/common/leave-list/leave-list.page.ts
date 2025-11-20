import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, NavController } from '@ionic/angular';

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
    private navCtrl: NavController
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
    // Arahkan ke rute global (di luar tabs)
    this.navCtrl.navigateForward('/leave-create');
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