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
    addIcons({ walletOutline, timeOutline, warningOutline, calendarOutline, cashOutline, alertCircleOutline });
  }

  async ngOnInit() {
    // ✅ CEK TOKEN TERSIMPAN
    await this.checkToken();
    this.loadSalary();
  }

  // ✅ FUNGSI UNTUK CEK TOKEN
  async checkToken() {
    // Cek dengan key baru
    const tokenNew = await this.storage.get('auth_token');
    // Cek dengan key lama (untuk debug)
    const tokenOld = await this.storage.get('_my_token');
    
    console.log('🔍 ===== TOKEN CHECK =====');
    console.log('🔑 Token (auth_token):', tokenNew ? 'ADA (✓)' : 'TIDAK ADA (✗)');
    console.log('🔑 Token (_my_token):', tokenOld ? 'ADA (✓)' : 'TIDAK ADA (✗)');
    
    if (tokenNew) {
      console.log('🔑 Token FULL (auth_token):', tokenNew);
    }
    if (tokenOld) {
      console.log('🔑 Token FULL (_my_token):', tokenOld);
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
          console.log('💰 Data gaji:', this.salaryData);
        } else {
          this.errorMsg = res.message || 'Gagal memuat data gaji.';
          console.error('❌ API Error:', this.errorMsg);
        }
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        // ✅ LOG DETAIL ERROR
        console.error('❌ ERROR DETAILS:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          url: err.url,
          error: err.error,
          headers: err.headers,
          fullError: err
        });
        
        // Handle specific error cases
        if (err.status === 0) {
          this.errorMsg = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
          console.error('🚫 Status 0: CORS issue atau server tidak dapat dijangkau');
        } else if (err.status === 401) {
          this.errorMsg = 'Sesi Anda telah berakhir. Silakan login kembali.';
          console.error('🔒 Status 401: Token tidak valid atau sudah expired');
          
          // Redirect ke login setelah 2 detik
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else if (err.status === 404) {
          this.errorMsg = 'Endpoint tidak ditemukan. Hubungi administrator.';
          console.error('🔍 Status 404: Route /api/v1/driver/salary tidak ada');
        } else if (err.status === 500) {
          this.errorMsg = 'Terjadi kesalahan pada server. Coba lagi nanti.';
          console.error('💥 Status 500: Internal Server Error');
        } else {
          this.errorMsg = err.error?.message || `Error ${err.status}: ${err.statusText}`;
          console.error(`⚠️ Status ${err.status}:`, err.error);
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