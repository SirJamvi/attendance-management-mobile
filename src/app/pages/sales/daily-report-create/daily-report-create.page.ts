import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, NavController } from '@ionic/angular';

// Impor Service dan Komponen
import { SalesReportService } from 'src/app/services/sales-report'; // Pastikan nama file service benar
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-daily-report-create',
  templateUrl: './daily-report-create.page.html',
  styleUrls: ['./daily-report-create.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class DailyReportCreatePage implements OnInit {

  // State Data
  isLoading = true;
  isSubmitting = false;
  
  // Data dari API
  todaySummary: any = null;
  existingReport: any = null;

  // Model Form
  obstacles: string = '';
  tomorrowPlan: string = '';

  constructor(
    private salesReportService: SalesReportService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadReportData();
  }

  /**
   * Mengambil data awal: Ringkasan Kunjungan & Status Laporan
   */
  loadReportData(event?: any) {
    this.isLoading = true;
    this.salesReportService.getDailyReport().subscribe({
      next: (response) => {
        this.todaySummary = response.data.todaySummary;
        this.existingReport = response.data.existingReport;
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Gagal memuat data laporan:', err);
        this.isLoading = false;
        if (event) event.target.complete();
        this.showAlert('Error', 'Gagal memuat data. Silakan periksa koneksi internet Anda.');
      }
    });
  }

  /**
   * Submit Laporan Harian
   */
  async onSubmit() {
    // Validasi Sesuai SOP [cite: 323-325]
    if (!this.tomorrowPlan || this.tomorrowPlan.length < 10) {
      this.showAlert('Validasi', 'Rencana besok wajib diisi (minimal 10 karakter).');
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim laporan...' });
    await loading.present();

    this.salesReportService.submitDailyReport(this.obstacles, this.tomorrowPlan).subscribe({
      next: async (response) => {
        loading.dismiss();
        this.isSubmitting = false;
        await this.showAlert('Berhasil', 'Laporan harian berhasil dikirim.');
        // Refresh data untuk menampilkan tampilan "Sudah Lapor"
        this.loadReportData();
      },
      error: (err) => {
        loading.dismiss();
        this.isSubmitting = false;
        console.error('Error submit report:', err);
        const msg = err.error?.message || 'Gagal mengirim laporan.';
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

  goBack() {
    this.navCtrl.navigateBack('/tabs/sales/dashboard');
  }
}