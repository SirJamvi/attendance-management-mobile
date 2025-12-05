import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  NavController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircle,
  time,
  location,
  personAdd,
  trophy,
  camera,
  addCircle,
  documentText,
  calendar,
  statsChart,
  briefcase,
  peopleOutline,
  trendingUp
} from 'ionicons/icons';

// Impor Service & Komponen
import { SalesReportService } from 'src/app/services/sales-report';
import { AuthService } from 'src/app/services/auth'; 
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-sales-dashboard',
  templateUrl: './sales-dashboard.page.html',
  styleUrls: ['./sales-dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonProgressBar,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    CommonModule, 
    FormsModule, 
    LoadingSpinnerComponent
  ]
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
  ) {
    // Registrasi semua icon yang digunakan
    addIcons({ 
      checkmarkCircle,
      time,
      location,
      personAdd,
      trophy,
      camera,
      addCircle,
      documentText,
      calendar,
      statsChart,
      briefcase,
      peopleOutline,
      trendingUp
    });
  }

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
    this.isLoading = true;
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
   * Handle pull to refresh
   */
  handleRefresh(event: any) {
    this.loadDashboardData(event);
  }

  /**
   * Navigasi manual
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

  /**
   * Helper: Format greeting berdasarkan waktu
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  /**
   * Helper: Get status color
   */
  getStatusColor(current: number, target: number): string {
    const percentage = (current / target) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  }
}