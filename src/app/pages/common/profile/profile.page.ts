import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
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
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { addIcons } from 'ionicons';
import { person, mail, briefcase, logOut, storefrontOutline } from 'ionicons/icons';

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
    IonButtons,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonAvatar,
    IonText,
    BranchBadgeComponent,
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
    addIcons({ person, mail, briefcase, logOut, storefrontOutline });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  loadUserData() {
    this.user = this.authService.getCurrentUserValue();
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
      await this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('❌ Error logout:', error);
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  getRoleName(): string {
    if (!this.user?.role) return 'User';
    const roleMap: Record<string, string> = {
      ko: 'Kepala Operasional (KO)',
      kasir: 'Kasir / Operasional',
      driver: 'Driver',
      sales: 'Sales',
      admin: 'Administrator',
      owner: 'Owner',
    };
    return roleMap[this.user.role] || this.user.role;
  }

  getRoleColor(): string {
    switch (this.user?.role) {
      case 'ko':
      case 'kasir':
        return 'tertiary';
      case 'driver':
        return 'primary';
      case 'sales':
        return 'success';
      case 'admin':
      case 'owner':
        return 'danger';
      default:
        return 'medium';
    }
  }
}
