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
import { eye, eyeOff, eyeOutline, eyeOffOutline, logIn, logoGoogle, storefrontOutline } from 'ionicons/icons';

import { AuthService } from 'src/app/services/auth';
import { Storage } from 'src/app/services/storage';
import { BranchService } from 'src/app/services/branch.service';
import { AttendanceService } from 'src/app/services/attendance';
import { BranchSelectModalComponent } from 'src/app/components/branch-select-modal/branch-select-modal.component';
import { Branch, User } from 'src/app/types/api.types';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

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
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText, IonSpinner,
    BranchSelectModalComponent
  ]
})
export class LoginPage implements OnInit {
  private storage = inject(Storage);
  private alertCtrl = inject(AlertController);
  private branchService = inject(BranchService);
  private attendanceService = inject(AttendanceService);

  username = '';
  password = '';
  isSubmitting = false;
  isGoogleSubmitting = false;
  showPassword = false;
  errorMessage = '';

  // State Pop-up Pemilihan Cabang Pasca-Login
  isBranchModalOpen = false;
  branches: Branch[] = [];
  selectedBranchId: number | null = null;
  pendingUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ eye, eyeOff, eyeOutline, eyeOffOutline, logIn, logoGoogle, storefrontOutline });
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

          await this.handlePostLoginSuccess(response.data.user);
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
            err.error?.data?.error ||
            err.error?.message ||
            'Akun Anda dinonaktifkan atau tidak memiliki izin akses mobile.';
          this.errorMessage = forbiddenMsg;
          await this.showRoleGuardAlert(forbiddenMsg);
          return;
        }

        let apiMsg = 'Login gagal. Periksa koneksi atau kredensial Anda.';
        if (err.status === 0 || err.name === 'TimeoutError' || err.status === 408) {
          apiMsg = 'Gagal terhubung ke server. Periksa koneksi internet Anda atau coba beberapa saat lagi.';
        } else if (err.status === 401) {
          apiMsg =
            err.error?.data?.error ||
            (err.error?.message && err.error?.message !== 'Unauthorized.'
              ? err.error.message
              : 'Username atau Password salah. Silakan periksa kembali.');
        } else if (err.status === 422) {
          apiMsg = err.error?.message || 'Data login tidak lengkap.';
        } else {
          apiMsg = err.error?.data?.error || err.error?.message || apiMsg;
        }

        this.errorMessage = apiMsg;
        await this.showToast(apiMsg, 'danger');
      }
    });
  }

  async onGoogleLogin() {
    this.errorMessage = '';
    const clientId = environment.googleClientId;

    // Jika berjalan pada platform native (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      await this.nativeGoogleLogin(clientId);
      return;
    }

    // Jika berjalan pada browser web
    if (clientId && typeof window !== 'undefined') {
      await this.triggerGoogleOneTap(clientId);
    } else {
      // Tampilkan dialog Google ID Token atau panduan jika belum di-set
      await this.showGoogleTokenPrompt();
    }
  }

  private async nativeGoogleLogin(clientId: string) {
    if (!clientId) {
      await this.showToast('Google Client ID belum dikonfigurasi.', 'warning');
      return;
    }

    this.isGoogleSubmitting = true;
    try {
      await SocialLogin.initialize({
        google: {
          webClientId: clientId,
        },
      });

      const res = await SocialLogin.login({
        provider: 'google',
        options: {
          style: 'bottom',
        },
      });

      let idToken: string | null = null;
      if (res?.result && 'idToken' in res.result) {
        idToken = res.result.idToken;
      }

      if (idToken) {
        this.processGoogleLogin(idToken);
      } else {
        this.isGoogleSubmitting = false;
        await this.showToast('Gagal memperoleh token autentikasi Google.', 'warning');
      }
    } catch (err: any) {
      this.isGoogleSubmitting = false;
      console.error('❌ Native Google Login error:', err);
      const errMsg = err?.message || err?.code || 'Login Google dibatalkan atau terjadi kesalahan.';
      if (typeof errMsg === 'string' && (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('user_cancel') || errMsg.includes('16'))) {
        return;
      }
      await this.showToast(`Login Google gagal: ${errMsg}`, 'danger');
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
      message: 'Masukkan ID Token Google akun Anda untuk otentikasi:',
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
          await this.handlePostLoginSuccess(response.data.user);
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

        let msg = 'Login Google gagal diverifikasi di server.';
        if (err.status === 0 || err.name === 'TimeoutError' || err.status === 408) {
          msg = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
        } else if (err.status === 401) {
          msg = err.error?.data?.error || err.error?.message || 'Autentikasi Google ditolak.';
        } else if (err.status === 404) {
          msg = err.error?.message || 'Akun Google tidak terdaftar di sistem.';
        } else if (err.status === 403) {
          msg = err.error?.data?.error || err.error?.message || 'Akun Anda dinonaktifkan atau tidak memiliki izin akses mobile.';
        } else {
          msg = err.error?.data?.error || err.error?.message || msg;
        }
        this.errorMessage = msg;
        await this.showToast(msg, 'danger');
      }
    });
  }

  async redirectUser(user: User) {
    await this.handlePostLoginSuccess(user);
  }

  private async handlePostLoginSuccess(user: User) {
    if (this.authService.isWebOnlyRole(user.role)) {
      const msg = 'Akun Owner/Admin hanya dapat diakses melalui Website Monitoring.';
      this.errorMessage = msg;
      await this.authService.logout();
      await this.showRoleGuardAlert(msg);
      return;
    }

    this.pendingUser = user;

    // Bersihkan cache lama dan ambil daftar cabang segar pasca-login
    this.branchService.clearCache();
    this.branchService.getBranches(true).subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          this.branches = res.data;
          this.selectedBranchId = user.branch_id || this.branches[0].id;
          // Tampilkan pop-up modal pemilihan cabang
          this.isBranchModalOpen = true;
        } else {
          this.proceedToApp(user);
        }
      },
      error: (err) => {
        console.warn('Gagal memuat cabang pasca login:', err);
        this.proceedToApp(user);
      }
    });
  }

  async onBranchConfirmed(branch: Branch) {
    this.isBranchModalOpen = false;
    if (this.pendingUser) {
      await this.authService.updateUserBranch(branch.id, branch.name);
      this.attendanceService.updateDutyBranch(branch.id).subscribe({
        next: (res) => console.log('✅ Duty branch pasca-login tersinkron:', res),
        error: (err) => console.warn('⚠️ Gagal sinkron duty branch pasca-login:', err)
      });
      await this.showToast(`Login berhasil (${branch.name})`, 'success');
      await this.proceedToApp(this.pendingUser);
    }
  }

  onBranchModalDismiss() {
    this.isBranchModalOpen = false;
    if (this.pendingUser) {
      this.proceedToApp(this.pendingUser);
    }
  }

  private async proceedToApp(user: User) {
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
