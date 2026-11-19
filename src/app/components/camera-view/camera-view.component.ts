import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonText,
  Platform,
  AlertController
} from '@ionic/angular/standalone';
import { CameraDirection } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, refreshOutline } from 'ionicons/icons';
import { captureCompressedPhoto } from 'src/app/utils/image-compressor';

@Component({
  selector: 'app-camera-view',
  templateUrl: './camera-view.component.html',
  styleUrls: ['./camera-view.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonText]
})
export class CameraViewComponent {
  @Input() direction: 'front' | 'rear' = 'front';
  @Input() promptHeader = 'Ambil Foto Kehadiran';
  @Input() maxWidth = 720;
  @Input() quality = 0.5;

  public photoPreview: string | null = null;
  @Output() photoTaken = new EventEmitter<string | null>();

  constructor(
    private alertCtrl: AlertController,
    private platform: Platform
  ) {
    addIcons({ camera, refreshOutline });
  }

  async takePicture() {
    await this.openCamera();
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.openCamera();
  }

  onMouseDown(event: MouseEvent) {
    // Kept for template compatibility
  }

  private async openCamera() {
    try {
      const compressedDataUrl = await captureCompressedPhoto({
        direction: this.direction === 'rear' ? CameraDirection.Rear : CameraDirection.Front,
        maxWidth: this.maxWidth,
        quality: this.quality,
        promptHeader: this.promptHeader,
      });

      if (compressedDataUrl) {
        this.photoPreview = compressedDataUrl;
        this.photoTaken.emit(compressedDataUrl);
      }
    } catch (error: any) {
      console.error('❌ Camera Error:', error);

      if (
        error?.message?.toLowerCase().includes('cancel') ||
        error?.message?.toLowerCase().includes('user denied')
      ) {
        return;
      }

      let errorMsg = 'Gagal membuka kamera';
      if (error?.message?.includes('permission')) {
        errorMsg = 'Izin kamera ditolak. Mohon berikan izin akses kamera.';
      } else if (error?.message?.includes('not available')) {
        errorMsg = 'Kamera tidak tersedia atau sedang digunakan aplikasi lain.';
      } else if (error?.message) {
        errorMsg = error.message;
      }

      this.showAlert('Error Kamera', errorMsg);
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
      buttons: ['OK']
    });
    await alert.present();
  }
}
