import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonItem, IonLabel, 
  IonInput, IonButton, IonIcon, IonText, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff, logIn } from 'ionicons/icons';

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
    addIcons({ eye, eyeOff, logIn });
  }

  ngOnInit() {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Username dan Password wajib diisi.';
      return;
    }

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

  redirectUser(user: any) {
    if (user.role.slug === 'driver') {
      this.router.navigate(['/tabs/driver'], { replaceUrl: true });
    } else if (user.role.slug === 'sales') {
      this.router.navigate(['/tabs/sales'], { replaceUrl: true });
    } else {
      this.errorMessage = 'Role akun tidak dikenali untuk aplikasi mobile.';
      this.authService.logout();
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