import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular'; // Gunakan modul Ionic lengkap

// Impor Service & Komponen
import { SalesReportService } from 'src/app/services/sales-report'; // (Pastikan nama file benar: sales-report.ts)
import { AuthService } from 'src/app/services/auth'; 
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-sales-dashboard',
  templateUrl: './sales-dashboard.page.html',
  styleUrls: ['./sales-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class SalesDashboardPage implements OnInit {

  // Variabel Data
  dashboardData: any = null;
  currentUser: any = null;
  isLoading = true;

  // Variabel Helper UI
  currentDate = new Date();

  constructor(
    private salesService: SalesReportService,
    public authService: AuthService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    // Ambil data user lokal untuk sapaan (Hello, Nama!)
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Dijalankan setiap kali halaman akan tampil
   */
  ionViewWillEnter() {
    this.loadDashboardData();
  }

  /**
   * Mengambil data dashboard dari API Laravel
   */
  loadDashboardData(event?: any) {
    this.salesService.getDashboard().subscribe({
      next: (response) => {
        this.dashboardData = response.data;
        this.isLoading = false;
        if (event) event.target.complete(); // Stop refresher
      },
      error: (err) => {
        console.error('Gagal memuat dashboard', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Navigasi manual (opsional, bisa juga pakai routerLink di HTML)
   */
  navigateTo(path: string) {
    this.navCtrl.navigateForward(path);
  }

  /**
   * Helper: Hitung persentase untuk progress bar
   */
  calculateProgress(current: number, target: number): number {
    if (!target || target <= 0) return 0;
    const progress = current / target;
    return progress > 1 ? 1 : progress; // Maksimal 1 (100%)
  }
}