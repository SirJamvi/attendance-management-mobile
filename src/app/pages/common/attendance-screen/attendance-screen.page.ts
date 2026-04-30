import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, 
  IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
  IonBadge, 
  AlertController, LoadingController, Platform 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline, timeOutline, alertCircleOutline, warningOutline } from 'ionicons/icons'; 
import { Geolocation, Position } from '@capacitor/geolocation';

import { CameraViewComponent } from '../../../components/camera-view/camera-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';
import { AttendanceService } from '../../../services/attendance';
import { Attendance } from '../../../types/api.types';

@Component({
  selector: 'app-attendance-screen',
  templateUrl: './attendance-screen.page.html',
  styleUrls: ['./attendance-screen.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CameraViewComponent, 
    LoadingSpinnerComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, 
    IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
    IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
    IonBadge 
  ]
})
export class AttendanceScreenPage implements OnInit {

  isLoading = true;
  attendanceToday: Attendance | null = null;
  
  // Data Shift & Libur
  shiftInfo: any = null;
  isDayOff: boolean = false;
  currentDayName: string = '';

  // Variable untuk warning
  hasSevereWarning: boolean = false;
  warningMessage: string = '';

  photoData: string | null = null;
  locationData: { latitude: number; longitude: number } | null = null;
  isSubmitDisabled = true;

  constructor(
    private attendanceService: AttendanceService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private platform: Platform
  ) {
    addIcons({ cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline, timeOutline, alertCircleOutline, warningOutline });
  }

  ngOnInit() {}

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

          // Ambil data warning dari API
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
    // ✅ Blok pemblokiran isDayOff DIHAPUS — presensi darurat kini diizinkan.
    // Proses langsung dilanjutkan ke pengiriman API tanpa cek hari libur.

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