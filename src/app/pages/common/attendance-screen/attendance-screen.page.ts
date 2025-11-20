import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, 
  IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
  IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
  AlertController, LoadingController, Platform 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, checkmarkCircle, checkmarkDoneCircle } from 'ionicons/icons';
import { Geolocation, Position } from '@capacitor/geolocation';

// PERBAIKAN 3: Path Import disesuaikan menjadi 3 level ke atas (../../../)
// Karena posisi file ada di src/app/pages/common/attendance-screen/
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
    IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList
  ]
})
export class AttendanceScreenPage implements OnInit {

  isLoading = true;
  attendanceToday: Attendance | null = null;
  
  photoData: string | null = null;
  locationData: { latitude: number; longitude: number } | null = null;
  isSubmitDisabled = true;

  constructor(
    private attendanceService: AttendanceService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private platform: Platform
  ) {
    addIcons({ cameraOutline, checkmarkCircle, checkmarkDoneCircle });
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
        this.isLoading = false;
      },
      // PERBAIKAN 4: Tambahkan tipe ': any' pada parameter error
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
      if (!this.platform.is('capacitor') && !this.platform.is('hybrid')) {
        // Logic untuk web
      }
      
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
      let msg = 'Pastikan GPS aktif dan izin lokasi diberikan.';
      if (error.message && error.message.includes('permission')) {
        msg = 'Izin lokasi ditolak oleh browser/perangkat.';
      }
      this.showAlert('Gagal Lokasi', msg);
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
    
    const loading = await this.loadingCtrl.create({ message: 'Mengirim Absen Masuk...' });
    await loading.present();

    this.attendanceService.checkIn(
      this.photoData!, 
      this.locationData!.latitude, 
      this.locationData!.longitude
    ).subscribe({
      next: () => {
        loading.dismiss();
        this.showAlert('Berhasil', 'Absen Masuk Tercatat!');
        this.loadStatus();
        this.resetForm();
      },
      // PERBAIKAN 4: Tambahkan tipe ': any' pada parameter error
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
      // PERBAIKAN 4: Tambahkan tipe ': any' pada parameter error
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