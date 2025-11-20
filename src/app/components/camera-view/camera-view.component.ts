import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonButton, 
  IonIcon, 
  IonText,
  Platform, 
  AlertController 
} from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource, Photo, CameraDirection } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, refreshOutline } from 'ionicons/icons';

@Component({
  selector: 'app-camera-view',
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonText
  ]
})
export class CameraViewComponent implements OnInit {
  
  public photoPreview: string | null = null;
  
  @Output() photoTaken = new EventEmitter<string | null>();

  constructor(
    private platform: Platform, 
    private alertCtrl: AlertController
  ) {
    // Registrasi icon yang digunakan
    addIcons({ camera, refreshOutline });
  }

  ngOnInit() {
    // Cek apakah PWA Elements sudah ter-load di browser
    if (this.platform.is('hybrid') === false) { // Jika di Web
      if (typeof customElements === 'undefined' || !customElements.get('pwa-camera-modal')) {
        console.warn('PERINGATAN: PWA Elements belum terdeteksi. Pastikan defineCustomElements(window) ada di main.ts');
      }
    }
  }

  /**
   * Fungsi utama untuk mengambil foto
   */
  async takePicture() {
    try {
      const image: Photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false, 
        resultType: CameraResultType.DataUrl,
        
        // --- KONFIGURASI KUNCI AGAR TIDAK BUKA FOLDER ---
        source: CameraSource.Camera, // Paksa gunakan mode Kamera
        webUseInput: false,          // MATIKAN fitur upload file (fallback)
        // -------------------------------------------------

        saveToGallery: false,
        direction: CameraDirection.Front, // ✅ DIPERBAIKI: Gunakan enum
        presentationStyle: 'fullscreen',
        
        // Label untuk UI PWA (jika muncul prompt)
        promptLabelHeader: 'Ambil Foto',
        promptLabelCancel: 'Batal',
        promptLabelPicture: 'Kamera'
      });

      if (image.dataUrl) {
        this.photoPreview = image.dataUrl;
        this.photoTaken.emit(image.dataUrl);
      }

    } catch (error: any) {
      console.error('Camera Error:', error);

      // Abaikan error jika user membatalkan atau menutup kamera
      if (error.message && (
          error.message.includes('User cancelled') || 
          error.message.includes('cancelled')
      )) {
        return;
      }

      // Deteksi spesifik jika PWA Elements hilang
      let msg = 'Gagal membuka kamera.';
      if (!this.platform.is('hybrid') && error.message.includes('No camera available')) {
         msg = 'Kamera tidak ditemukan atau PWA Elements belum dimuat. Coba refresh halaman.';
      }

      this.showAlert('Error', msg);
    }
  }

  retakePicture() {
    this.photoPreview = null;
    this.photoTaken.emit(null);
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