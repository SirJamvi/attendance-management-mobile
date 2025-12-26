import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonAvatar,
  IonText,
  AlertController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth';
import { User } from 'src/app/types/api.types';
import { addIcons } from 'ionicons';
import { person, mail, briefcase, logOut } from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonAvatar,
    IonText,
    CommonModule,
    FormsModule
  ]
})
export class ProfilePage implements OnInit {
  user: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({ person, mail, briefcase, logOut });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  loadUserData() {
    this.user = this.authService.getCurrentUserValue();
    console.log('👤 User data loaded:', this.user);
  }

  async confirmLogout() {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Logout',
      message: 'Apakah Anda yakin ingin keluar?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Ya, Logout',
          role: 'confirm',
          cssClass: 'danger',
          handler: () => {
            this.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    try {
      console.log('🚪 Logging out...');
      await this.authService.logout();
      console.log('✅ Logout berhasil');
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('❌ Error logout:', error);
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  getRoleName(): string {
    if (!this.user?.role) return 'User';
    return this.user.role.name || this.user.role.slug || 'User';
  }

  getRoleColor(): string {
    const slug = this.user?.role?.slug || '';
    switch(slug) {
      case 'driver': return 'primary';
      case 'sales': return 'success';
      case 'admin': return 'danger';
      default: return 'medium';
    }
  }
}