import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular'; // Hapus '/standalone' jika error, gunakan module biasa

// Impor Service dan Komponen
import { AttendanceService } from 'src/app/services/attendance';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-driver-history',
  templateUrl: './driver-history.page.html',
  styleUrls: ['./driver-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class DriverHistoryPage implements OnInit {

  // Data
  historyData: any[] = [];
  isLoading = false;

  // Filter Tanggal (Default: Hari ini)
  startDate: string = new Date().toISOString();
  endDate: string = new Date().toISOString();

  // Modal Detail
  selectedAttendance: any = null;
  isModalOpen = false;

  constructor(
    private attendanceService: AttendanceService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    // Set default tanggal awal ke 1 bulan yang lalu agar data terlihat
    const date = new Date();
    date.setDate(1); // Tanggal 1 bulan ini
    this.startDate = date.toISOString();
  }

  ionViewWillEnter() {
    this.loadHistory();
  }

  /**
   * Load data riwayat dari API
   */
  loadHistory(event?: any) {
    this.isLoading = true;

    // Format tanggal ke YYYY-MM-DD untuk API Laravel
    const start = this.startDate.split('T')[0];
    const end = this.endDate.split('T')[0];

    this.attendanceService.getHistory(start, end).subscribe({
      next: (response) => {
        this.historyData = response.data.data; // Laravel Pagination meletakkan items di dalam .data
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Gagal memuat history', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Tampilkan detail presensi (Foto & Lokasi)
   */
  openDetail(item: any) {
    this.selectedAttendance = item;
    this.isModalOpen = true;
  }

  closeDetail() {
    this.isModalOpen = false;
    this.selectedAttendance = null;
  }

  /**
   * Helper untuk warna status
   */
  getStatusColor(status: string) {
    return status === 'late' ? 'danger' : 'success';
  }

  getStatusLabel(status: string) {
    return status === 'late' ? 'Terlambat' : 'Tepat Waktu';
  }
}