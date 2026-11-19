import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonIcon, IonText, IonSpinner,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff, eyeOutline, eyeOffOutline, logIn, logoGoogle } from 'ionicons/icons';

import { AuthService } from 'src/app/services/auth';
import { Storage } from 'src/app/services/storage';
import { User } from 'src/app/types/api.types';
import { environment } from 'src/environments/environment';

declare const google: any;

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
  private alertCtrl = inject(AlertController);

  username = '';
  password = '';
  isSubmitting = false;
  isGoogleSubmitting = false;
  showPassword = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ eye, eyeOff, eyeOutline, eyeOffOutline, logIn, logoGoogle });
  }

  ngOnInit() {}

  togglePassword(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Username/Nama/Email dan Password wajib diisi.';
      return;
    }

    this.username = this.username.trim();
    this.password = this.password.trim();

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: async (response) => {
        this.isSubmitting = false;

        if (response.success && response.data?.user) {
          const savedToken = await this.storage.getToken();
          if (!savedToken) {
            await this.showToast('Error: Token tidak tersimpan. Coba login lagi.', 'danger');
            return;
          }

          await this.showToast(
            `Login Berhasil!${response.data.user.branch_name ? ' (' + response.data.user.branch_name + ')' : ''}`,
            'success'
          );
          await this.redirectUser(response.data.user);
        } else {
          this.errorMessage = response.message || 'Login gagal.';
        }
      },
      error: async (err) => {
        this.isSubmitting = false;
        console.error('❌ Login error:', err);

        // Role Guard: HTTP 403 WEB_ONLY_ROLE (Owner / Admin)
        if (err.status === 403 && err.error?.data?.code === 'WEB_ONLY_ROLE') {
          const webOnlyMsg = 'Akun Owner/Admin hanya dapat diakses melalui Website Monitoring.';
          this.errorMessage = webOnlyMsg;
          await this.showRoleGuardAlert(webOnlyMsg);
          return;
        }

        if (err.status === 403) {
          const forbiddenMsg =
            err.error?.message || 'Akun Owner/Admin hanya dapat diakses melalui Website Monitoring.';
          this.errorMessage = forbiddenMsg;
          await this.showRoleGuardAlert(forbiddenMsg);
          return;
        }

        const apiMsg =
          err.error?.message ||
          err.error?.data?.error ||
          'Login gagal. Periksa koneksi atau kredensial Anda.';
        this.errorMessage = apiMsg;
        await this.showToast(apiMsg, 'danger');
      }
    });
  }

  async onGoogleLogin() {
    this.errorMessage = '';
    const clientId = environment.googleClientId;

    if (clientId && typeof window !== 'undefined') {
      await this.triggerGoogleOneTap(clientId);
    } else {
      // Tampilkan dialog Google ID Token atau panduan jika belum di-set
      await this.showGoogleTokenPrompt();
    }
  }

  private async triggerGoogleOneTap(clientId: string) {
    this.isGoogleSubmitting = true;
    try {
      await this.loadGoogleScript();

      if (typeof google !== 'undefined' && google.accounts?.id) {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              this.processGoogleLogin(response.credential);
            } else {
              this.isGoogleSubmitting = false;
            }
          },
        });
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.isGoogleSubmitting = false;
            this.showGoogleTokenPrompt();
          }
        });
      } else {
        this.isGoogleSubmitting = false;
        await this.showGoogleTokenPrompt();
      }
    } catch (e) {
      this.isGoogleSubmitting = false;
      await this.showGoogleTokenPrompt();
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  private async showGoogleTokenPrompt() {
    const alert = await this.alertCtrl.create({
      header: 'Masuk dengan Google',
      message: 'Masukkan ID Token Google akun Anda untuk otentikasi ke server staging:',
      inputs: [
        {
          name: 'id_token',
          type: 'textarea',
          placeholder: 'Tempel Google id_token di sini...',
        },
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Masuk',
          handler: (data) => {
            const token = (data?.id_token || '').trim();
            if (token) {
              this.processGoogleLogin(token);
              return true;
            }
            this.showToast('ID Token Google tidak boleh kosong.', 'warning');
            return false;
          },
        },
      ],
    });
    await alert.present();
  }

  private processGoogleLogin(idToken: string) {
    this.isGoogleSubmitting = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle(idToken).subscribe({
      next: async (response) => {
        this.isGoogleSubmitting = false;
        if (response.success && response.data?.user) {
          await this.showToast('Login Google Berhasil!', 'success');
          await this.redirectUser(response.data.user);
        } else {
          this.errorMessage = response.message || 'Login Google gagal.';
        }
      },
      error: async (err) => {
        this.isGoogleSubmitting = false;
        console.error('❌ Google Login error:', err);

        if (err.status === 403 && err.error?.data?.code === 'WEB_ONLY_ROLE') {
          const webOnlyMsg = 'Akun Owner/Admin hanya dapat diakses melalui Website Monitoring.';
          this.errorMessage = webOnlyMsg;
          await this.showRoleGuardAlert(webOnlyMsg);
          return;
        }

        const msg = err.error?.message || err.error?.data?.error || 'Login Google gagal diverifikasi di server.';
        this.errorMessage = msg;
        await this.showToast(msg, 'danger');
      }
    });
  }

  async redirectUser(user: User) {
    if (this.authService.isWebOnlyRole(user.role)) {
      const msg = 'Akun Owner/Admin hanya dapat diakses melalui Website Monitoring.';
      this.errorMessage = msg;
      await this.authService.logout();
      await this.showRoleGuardAlert(msg);
      return;
    }

    const targetRoute = this.authService.getDefaultRouteForRole(user.role);
    if (targetRoute !== '/login') {
      this.router.navigate([targetRoute], { replaceUrl: true });
    } else {
      this.errorMessage = 'Role akun tidak dikenali untuk aplikasi mobile.';
      await this.authService.logout();
    }
  }

  async showRoleGuardAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Akses Dibatasi',
      message,
      buttons: ['Mengerti']
    });
    await alert.present();
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
