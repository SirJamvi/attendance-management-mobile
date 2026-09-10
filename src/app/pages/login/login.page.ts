import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonItem, IonLabel, 
  IonInput, IonButton, IonIcon, IonText, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff, eyeOutline, eyeOffOutline, logIn } from 'ionicons/icons';

import { AuthService } from 'src/app/services/auth';
import { Storage } from 'src/app/services/storage';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText, IonSpinner
  ]
})
export class LoginPage implements OnInit {
  private storage = inject(Storage);
  
  username = '';
  password = '';
  isSubmitting = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) { 
    // Menambahkan icon outline juga
    addIcons({ eye, eyeOff, eyeOutline, eyeOffOutline, logIn });
  }

  ngOnInit() {
    console.log('🔐 Login page initialized');
  }

  /**
   * Toggle visibility password
   */
  togglePassword(event?: Event) {
    // Prevent event bubbling
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    this.showPassword = !this.showPassword;
    console.log('👁️ Password visibility toggled:', this.showPassword ? 'VISIBLE' : 'HIDDEN');
    console.log('👁️ Current showPassword value:', this.showPassword);
  }

  async onLogin() {
    // Validasi input
    if (!this.username || !this.password) {
      this.errorMessage = 'Username dan Password wajib diisi.';
      return;
    }

    // Trim whitespace
    this.username = this.username.trim();
    this.password = this.password.trim();

    this.isSubmitting = true;
    this.errorMessage = '';

    console.log('🔐 Attempting login...');

    this.authService.login(this.username, this.password).subscribe({
      next: async (response) => {
        console.log('📥 Login response received:', response);
        this.isSubmitting = false;
        
        if (response.success) {
          console.log('✅ Login successful!');
          
          // Double check: Apakah token benar-benar tersimpan?
          setTimeout(async () => {
            const savedToken = await this.storage.getToken();
            console.log('🔍 Double check - Token tersimpan?', savedToken ? 'YES' : 'NO');
            
            if (!savedToken) {
              console.error('❌ CRITICAL: Token tidak tersimpan setelah login!');
              await this.showToast('Error: Token tidak tersimpan. Coba login lagi.', 'danger');
              return;
            }
            
            console.log('✅ Token verified, redirecting...');
            await this.showToast('Login Berhasil!', 'success');
            this.redirectUser(response.data.user);
          }, 500);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('❌ Login error:', err);
        
        const apiMsg = err.error?.message || err.error?.data?.error || 'Login gagal. Periksa koneksi atau kredensial Anda.';
        this.errorMessage = apiMsg;
        this.showToast(apiMsg, 'danger');
      }
    });
  }

 /**
   * Redirect user berdasarkan role
   */
  redirectUser(user: any) {
    console.log('🚀 Redirecting user with role:', user.role);
    
    // Cek langsung string role karena DB Buku Digital mengirimkan string, bukan objek
    if (user.role === 'driver') {
      this.router.navigate(['/tabs/driver'], { replaceUrl: true });
    } else if (user.role === 'sales') {
      this.router.navigate(['/tabs/sales'], { replaceUrl: true });
    } else if (user.role === 'kasir') {
      // ✅ TAMBAHKAN BLOK INI UNTUK KASIR
      // Pastikan rute '/tabs/kasir' (atau rute lain yang kamu siapkan) sudah ada di app.routes.ts
      this.router.navigate(['/tabs/kasir'], { replaceUrl: true });
    } else {
      console.error('❌ Unknown role:', user.role);
      this.errorMessage = 'Role akun tidak dikenali untuk aplikasi mobile.';
      this.authService.logout();
    }
  }

  /**
   * Menampilkan toast message
   */
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