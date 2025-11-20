import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';

// Impor Service dan Komponen
import { SalesReportService } from 'src/app/services/sales-report';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-visit-report-list',
  templateUrl: './visit-report-list.page.html',
  styleUrls: ['./visit-report-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class VisitReportListPage implements OnInit {

  visits: any[] = [];
  isLoading = true;

  constructor(
    private salesService: SalesReportService,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
  }

  // Dijalankan setiap kali halaman dibuka
  ionViewWillEnter() {
    this.loadVisits();
  }

  /**
   * Mengambil data kunjungan hari ini dari API
   */
  loadVisits(event?: any) {
    // Jika ditarik (refresh), jangan set isLoading true agar UI tidak kedip
    if (!event) this.isLoading = true;

    this.salesService.getVisitHistoryToday().subscribe({
      next: (response) => {
        this.visits = response.data || [];
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Gagal memuat kunjungan:', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Navigasi ke halaman tambah kunjungan
   */
  goToCreate() {
    this.navCtrl.navigateForward('/tabs/sales/visit-create');
  }

  /**
   * Helper untuk warna badge berdasarkan hasil kunjungan
   */
  getResultColor(result: string): string {
    switch (result) {
      case 'Sign Up': return 'success';
      case 'Presentasi': return 'primary';
      case 'Follow Up': return 'warning';
      case 'Ditolak': return 'danger';
      default: return 'medium';
    }
  }
}