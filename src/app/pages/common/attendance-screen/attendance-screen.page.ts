import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, 
  IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
  IonBadge, IonGrid, IonRow, IonCol,
  AlertController, LoadingController, Platform 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline, timeOutline, alertCircleOutline, warningOutline, flame, giftOutline } from 'ionicons/icons'; 
import { Geolocation, Position } from '@capacitor/geolocation';

import { CameraViewComponent } from '../../../components/camera-view/camera-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';
import { AttendanceService } from '../../../services/attendance';
// ✅ TAMBAHKAN IMPORT INI
import { AuthService } from '../../../services/auth';

import { Attendance } from '../../../types/api.types';

@Component({
  selector: 'app-attendance-screen',
  templateUrl: './attendance-screen.page.html',
  styleUrls: ['./attendance-screen.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    CameraViewComponent, 
    LoadingSpinnerComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, 
    IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
    IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
    IonBadge, IonGrid, IonRow, IonCol
  ]
})
export class AttendanceScreenPage implements OnInit {

  isLoading = true;
  attendanceToday: Attendance | null = null;
  
  shiftInfo: any = null;
  isDayOff: boolean = false;
  currentDayName: string = '';

  hasSevereWarning: boolean = false;
  warningMessage: string = '';

  photoData: string | null = null;
  locationData: { latitude: number; longitude: number } | null = null;
  isSubmitDisabled = true;

  // Properti untuk menyimpan data misi aktif
  activeMissions: any[] = [];

  // ✅ TAMBAHKAN PROPERTI INI
  userRole: string = '';

  constructor(
    private attendanceService: AttendanceService,
    // ✅ INJEKSI INI
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private platform: Platform
  ) {
    addIcons({ cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline, timeOutline, alertCircleOutline, warningOutline, flame, giftOutline });
  }

  ngOnInit() {
    // ✅ Ambil role saat halaman diinisialisasi
    const user = this.authService.getCurrentUserValue();
    this.userRole = user?.role || '';
  }

  ionViewWillEnter() {
    this.loadStatus();
    this.resetForm();
  }

  async loadStatus() {
    this.isLoading = true;
    this.attendanceService.getStatus().subscribe({
      next: (response: any) => {
        this.attendanceToday = response.data;
        
        if (response.meta) {
          this.shiftInfo = {
            name: response.meta.shift_name,
            start: response.meta.shift_start,
            end: response.meta.shift_end
          };
          this.isDayOff = response.meta.is_day_off;
          this.currentDayName = response.meta.current_day;
          this.hasSevereWarning = response.meta.severe_warning;
          this.warningMessage = response.meta.warning_message;
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error loading status:', err);
      }
    });

    // ✅ PENCEGAHAN: Hanya tarik data misi jika dia adalah driver
    if (this.userRole === 'driver') {
      this.attendanceService.getActiveMissions().subscribe({
        next: (res: any) => {
          console.log('🎯 missions response:', JSON.stringify(res)); // ← DEBUG
          // Toleran terhadap variasi format respons
          if (res && res.success === true && Array.isArray(res.data)) {
            this.activeMissions = res.data;
            console.log('✅ activeMissions loaded:', this.activeMissions.length);
          } else if (res && Array.isArray(res.data)) {
            // Fallback jika backend tidak kirim field "success"
            this.activeMissions = res.data;
          } else {
            console.warn('⚠️ Format respons tidak dikenali:', res);
            this.activeMissions = [];
          }
        },
        error: (err: any) => {
          console.error('❌ Error loading active missions:', err);
          console.error('❌ Status:', err.status, '| Message:', err.error?.message);
        }
      });
    }
  }

  async handlePhoto(photoBase64: string | null) {
    this.photoData = photoBase64;
    if (this.photoData) {
      await this.getGeolocation();
    }
    this.checkFormState();
  }

  async getGeolocation() {
    try {
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });
      this.locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error: any) {
      console.error('GPS Error', error);
      this.showAlert('Gagal Lokasi', 'Pastikan GPS aktif.');
      this.locationData = null;
    }
  }

  checkFormState() {
    this.isSubmitDisabled = !(this.photoData && this.locationData);
  }

  resetForm() {
    this.photoData = null;
    this.locationData = null;
    this.isSubmitDisabled = true;
  }

  async submitCheckIn() {
    if (this.isSubmitDisabled) return;
    
    const loading = await this.loadingCtrl.create({ 
      message: this.isDayOff ? 'Mengirim Presensi Darurat...' : 'Mengirim Absen Masuk...' 
    });
    await loading.present();

    this.attendanceService.checkIn(
      this.photoData!, 
      this.locationData!.latitude, 
      this.locationData!.longitude
    ).subscribe({
      next: () => {
        loading.dismiss();
        const message = this.isDayOff
          ? 'Presensi darurat berhasil dikirim. Menunggu validasi Admin.'
          : 'Absen Masuk Tercatat!';
        this.showAlert('Berhasil', message);
        this.loadStatus();
        this.resetForm();
      },
      error: (err: any) => {
        loading.dismiss();
        this.showAlert('Gagal', err.error?.message || 'Gagal mengirim data.');
      }
    });
  }

  async submitCheckOut() {
    if (this.isSubmitDisabled) return;

    const loading = await this.loadingCtrl.create({ message: 'Mengirim Absen Pulang...' });
    await loading.present();
    
    this.attendanceService.checkOut(
      this.photoData!, 
      this.locationData!.latitude, 
      this.locationData!.longitude
    ).subscribe({
      next: () => {
        loading.dismiss();
        this.showAlert('Berhasil', 'Absen Pulang Tercatat!');
        this.loadStatus();
        this.resetForm();
      },
      error: (err: any) => {
        loading.dismiss();
        this.showAlert('Gagal', err.error?.message || 'Gagal mengirim data.');
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}