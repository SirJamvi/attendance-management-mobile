import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, 
  IonInput, IonButton, IonIcon, IonText, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff, logIn } from 'ionicons/icons';

// Impor Service kita
import { AuthService } from 'src/app/services/auth';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText, IonSpinner,
    LoadingSpinnerComponent
  ]
})
export class LoginPage implements OnInit {

  // Model untuk form
  username = '';
  password = '';
  
  // State UI
  isSubmitting = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) { 
    // Daftarkan ikon yang dipakai
    addIcons({ eye, eyeOff, logIn });
  }

  ngOnInit() {}

  /**
   * Toggle untuk melihat/menyembunyikan password
   */
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  /**
   * Proses Login Utama
   */
  async onLogin() {
    // 1. Validasi Sederhana
    if (!this.username || !this.password) {
      this.errorMessage = 'Username dan Password wajib diisi.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // 2. Panggil AuthService
    this.authService.login(this.username, this.password).subscribe({
      next: async (response) => {
        // Login Berhasil
        this.isSubmitting = false;
        await this.showToast('Login Berhasil!', 'success');
        
        // 3. Arahkan user berdasarkan Role (Sesuai SOP)
        this.redirectUser(response.data.user);
      },
      error: (err) => {
        // Login Gagal
        this.isSubmitting = false;
        console.error('Login error:', err);
        
        // Tampilkan pesan error dari API jika ada
        const apiMsg = err.error?.message || err.error?.data?.error || 'Login gagal. Periksa koneksi atau kredensial Anda.';
        this.errorMessage = apiMsg;
        this.showToast(apiMsg, 'danger');
      }
    });
  }

  /**
   * Helper untuk mengarahkan user
   */
  redirectUser(user: any) {
    if (user.role.slug === 'driver') {
      // Driver -> Langsung ke Presensi [SOP]
      this.router.navigate(['/tabs/driver'], { replaceUrl: true });
    } else if (user.role.slug === 'sales') {
      // Sales -> Dashboard [SOP]
      this.router.navigate(['/tabs/sales'], { replaceUrl: true });
    } else {
      this.errorMessage = 'Role akun tidak dikenali untuk aplikasi mobile.';
      this.authService.logout(); // Logout paksa jika bukan driver/sales
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}