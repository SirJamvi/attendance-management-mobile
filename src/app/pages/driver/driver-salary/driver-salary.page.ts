import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonNote, IonIcon, IonText, IonRefresher, IonRefresherContent,
  IonBadge, IonSpinner, IonList, IonItemDivider, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// ✅ TAMBAHAN: alertCircleOutline untuk warning merah
import { walletOutline, timeOutline, warningOutline, calendarOutline, cashOutline, alertCircleOutline } from 'ionicons/icons';
import { SalaryService, SalaryData } from 'src/app/services/salary.service';

@Component({
  selector: 'app-driver-salary',
  templateUrl: './driver-salary.page.html',
  styleUrls: ['./driver-salary.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonNote, IonIcon, IonText, IonRefresher, IonRefresherContent,
    IonBadge, IonSpinner, IonList, IonItemDivider, IonButton
  ]
})
export class DriverSalaryPage implements OnInit {
  private salaryService = inject(SalaryService);
  private router = inject(Router);
  private storage = inject(Storage);
  
  salaryData: SalaryData | null = null;
  isLoading = true;
  errorMsg = '';

  constructor() {
    // ✅ Pastikan semua icon terdaftar, termasuk alertCircleOutline
    addIcons({ walletOutline, timeOutline, warningOutline, calendarOutline, cashOutline, alertCircleOutline });
  }

  async ngOnInit() {
    // ✅ CEK TOKEN TERSIMPAN (Penting untuk debugging)
    await this.checkToken();
    this.loadSalary();
  }

  // ✅ FUNGSI DEBUGGING TOKEN
  async checkToken() {
    const tokenNew = await this.storage.get('auth_token');
    const tokenOld = await this.storage.get('_my_token'); // Cek key lama jika ada
    
    console.log('🔍 ===== TOKEN CHECK =====');
    console.log('🔑 Token (auth_token):', tokenNew ? 'ADA (✓)' : 'TIDAK ADA (✗)');
    
    if (tokenNew) {
      console.log('🔑 Token Detail:', tokenNew.substring(0, 20) + '...');
    }
    
    if (!tokenNew && !tokenOld) {
      console.error('❌ TIDAK ADA TOKEN SAMA SEKALI! User perlu login ulang.');
    }
    console.log('🔍 ===== END TOKEN CHECK =====');
  }

  loadSalary(event?: any) {
    if (!event) this.isLoading = true;
    this.errorMsg = '';

    console.log('📡 Mengirim request ke API...');

    this.salaryService.getDriverSalary().subscribe({
      next: (res) => {
        console.log('✅ Response dari API:', res);
        
        if (res.success) {
          this.salaryData = res.data;
          
          // Debugging khusus untuk fitur warning baru
          if (this.salaryData.severe_warning) {
            console.warn('⚠️ DRIVER MENDAPAT PERINGATAN KERAS:', this.salaryData.warning_message);
          }
          
        } else {
          this.errorMsg = res.message || 'Gagal memuat data gaji.';
          console.error('❌ API Error Message:', this.errorMsg);
        }
        
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        // ✅ LOG DETAIL ERROR (Sangat berguna untuk debug)
        console.error('❌ ERROR DETAILS:', {
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          error: err.error
        });
        
        // Handle specific error cases
        if (err.status === 0) {
          this.errorMsg = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau CORS.';
        } else if (err.status === 401) {
          this.errorMsg = 'Sesi Anda telah berakhir. Silakan login kembali.';
          
          // Redirect ke login otomatis jika 401
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
          
        } else if (err.status === 404) {
          this.errorMsg = 'Data tidak ditemukan (404).';
        } else if (err.status === 500) {
          this.errorMsg = 'Terjadi kesalahan pada server (500).';
        } else {
          this.errorMsg = err.error?.message || 'Terjadi kesalahan saat memuat data.';
        }
        
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  doRefresh(event: any) {
    this.loadSalary(event);
  }
}