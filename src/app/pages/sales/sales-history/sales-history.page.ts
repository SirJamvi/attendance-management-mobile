import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular'; // Hapus '/standalone' jika error

// Impor Service & Komponen
import { SalesReportService } from 'src/app/services/sales-report'; // (Pastikan nama file benar: sales-report.ts)
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-sales-history',
  templateUrl: './sales-history.page.html',
  styleUrls: ['./sales-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class SalesHistoryPage implements OnInit {

  // Tab aktif (default: 'attendance')
  activeSegment: string = 'attendance';

  // Data
  attendanceHistory: any[] = [];
  visitHistory: any[] = [];
  isLoading = false;

  // Filter Tanggal (Default: 1 Bulan)
  startDate: string = '';
  endDate: string = '';

  // Modal Detail
  selectedItem: any = null;
  isModalOpen = false;

  constructor(
    private salesService: SalesReportService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    // Set default tanggal (1 bulan terakhir)
    const end = new Date();
    const start = new Date();
    start.setDate(1); // Awal bulan ini

    this.startDate = start.toISOString();
    this.endDate = end.toISOString();
  }

  ionViewWillEnter() {
    this.loadHistory();
  }

  /**
   * Ganti Tab (Segmen)
   */
  segmentChanged(event: any) {
    this.activeSegment = event.detail.value;
  }

  /**
   * Load Data dari API
   */
  loadHistory(event?: any) {
    this.isLoading = true;

    // Format YYYY-MM-DD
    const start = this.startDate.split('T')[0];
    const end = this.endDate.split('T')[0];

    this.salesService.getHistory(start, end).subscribe({
      next: (response) => {
        // API mengembalikan { attendances: {...}, visits: {...} }
        // Kita ambil data array-nya dari properti .data (pagination Laravel)
        this.attendanceHistory = response.data.attendances.data || [];
        this.visitHistory = response.data.visits.data || [];
        
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Gagal memuat history sales', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Buka Detail Modal
   */
  openDetail(item: any) {
    this.selectedItem = item;
    this.isModalOpen = true;
  }

  closeDetail() {
    this.isModalOpen = false;
    this.selectedItem = null;
  }

  /**
   * Helper Warna Status (Sama seperti Driver)
   */
  getStatusColor(status: string) {
    if (status === 'late' || status === 'Ditolak') return 'danger';
    if (status === 'present' || status === 'Sign Up') return 'success';
    if (status === 'Follow Up') return 'warning';
    return 'primary'; // Presentasi
  }
}