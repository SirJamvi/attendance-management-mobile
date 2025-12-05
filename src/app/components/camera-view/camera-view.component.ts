import { Component, Output, EventEmitter } from '@angular/core';
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
  imports: [CommonModule, IonButton, IonIcon, IonText]
})
export class CameraViewComponent {
  
  public photoPreview: string | null = null;
  @Output() photoTaken = new EventEmitter<string | null>();

  constructor(
    private alertCtrl: AlertController,
    private platform: Platform
  ) {
    addIcons({ camera, refreshOutline });
    console.log('✅ CameraViewComponent initialized');
  }

  // ✅ Handle click event
  async takePicture() {
    console.log('🎥 takePicture() called - Click detected!');
    await this.openCamera();
  }

  // ✅ Handle touch event (untuk mobile)
  onTouchStart(event: TouchEvent) {
    console.log('👆 Touch detected!');
    event.preventDefault();
    this.openCamera();
  }

  // ✅ Handle mouse event (untuk desktop)
  onMouseDown(event: MouseEvent) {
    console.log('🖱️ Mouse down detected!');
  }

  // ✅ Fungsi utama untuk membuka kamera - LANGSUNG TANPA PILIHAN
  private async openCamera() {
    try {
      console.log('📸 Opening camera directly...');
      
      const image: Photo = await Camera.getPhoto({
        quality: 70, // Compress foto agar tidak terlalu besar
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        
        // ✅ UBAH INI: Gunakan CameraSource.Camera untuk langsung buka kamera
        source: CameraSource.Camera, // Langsung buka kamera (BUKAN Prompt)
        
        saveToGallery: false,
        
        // ✅ Gunakan kamera depan (front) untuk selfie
        direction: CameraDirection.Front,
        
        // ✅ Batasi ukuran foto
        width: 800,
        height: 800,
        
        // ✅ Labels untuk PWA (web)
        promptLabelHeader: 'Ambil Foto Kehadiran',
        promptLabelCancel: 'Batal',
        promptLabelPicture: 'Ambil Foto',
        
        // ✅ Fullscreen untuk pengalaman lebih baik
        presentationStyle: 'fullscreen'
      });

      if (image.dataUrl) {
        console.log('✅ Foto berhasil diambil');
        console.log('📊 Ukuran foto:', image.dataUrl.length, 'characters');
        this.photoPreview = image.dataUrl;
        this.photoTaken.emit(image.dataUrl);
      }

    } catch (error: any) {
      console.error('❌ Camera Error:', error);
      
      // Abaikan jika user cancel
      if (error.message?.toLowerCase().includes('cancel') || 
          error.message?.toLowerCase().includes('user denied')) {
        console.log('User cancelled camera');
        return;
      }
      
      // Tampilkan error yang lebih informatif
      let errorMsg = 'Gagal membuka kamera';
      
      if (error.message?.includes('permission')) {
        errorMsg = 'Izin kamera ditolak. Mohon berikan izin akses kamera.';
      } else if (error.message?.includes('not available')) {
        errorMsg = 'Kamera tidak tersedia atau sedang digunakan aplikasi lain.';
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      this.showAlert('Error Kamera', errorMsg);
    }
  }

  retakePicture() {
    console.log('🔄 Retake photo');
    this.photoPreview = null;
    this.photoTaken.emit(null);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ 
      header, 
      message, 
      buttons: ['OK'] 
    });
    await alert.present();
  }
} 