import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonSpinner,
  LoadingController,
  ToastController,
  NavController,
  ActionSheetController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  imageOutline,
  locationOutline,
  sendOutline,
  informationCircleOutline,
  checkmarkCircle,
  sparklesOutline,
  cardOutline,
  trophyOutline,
  refreshOutline,
  chevronDownOutline,
  chevronUpOutline,
  ellipseOutline
} from 'ionicons/icons';

// Plugin Capacitor & Kompresi Foto Ultra-Ringan
import { CameraDirection, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { captureCompressedPhoto, captureDetailedPhoto } from 'src/app/utils/image-compressor';
import { BusinessCardService, BusinessCardKpiData } from 'src/app/services/business-card.service';

@Component({
  selector: 'app-delivery-proof',
  templateUrl: './delivery-proof.page.html',
  styleUrls: ['./delivery-proof.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonProgressBar,
    IonSpinner
  ]
})
export class DeliveryProofPage implements OnInit {
  private businessCardService = inject(BusinessCardService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);
  private router = inject(Router);

  // Model Form Penyerahan Kartu Nama (Prospek Baru)
  formData = {
    customer_name: '',
    customer_phone: '',
    address: '',
    notes: '',
    latitude: '',
    longitude: '',
    photo: ''
  };

  previewImage: string | undefined;
  isSubmitting = false;
  isLoadingKpi = false;
  inTabs = false;
  showOptional = false;

  // Data KPI Mingguan & Bulanan
  kpi: BusinessCardKpiData = {
    week_target: 7,
    week_achieved: 0,
    week_progress_percent: 0,
    month_target: 28,
    month_achieved: 0,
    month_progress_percent: 0,
    is_weekly_target_reached: false,
    is_monthly_target_reached: false
  };

  constructor() {
    addIcons({
      cameraOutline,
      imageOutline,
      locationOutline,
      sendOutline,
      informationCircleOutline,
      checkmarkCircle,
      sparklesOutline,
      cardOutline,
      trophyOutline,
      refreshOutline,
      chevronDownOutline,
      chevronUpOutline,
      ellipseOutline
    });
  }

  ngOnInit() {
    this.loadKpi();
  }

  ionViewWillEnter() {
    this.inTabs = this.router.url.startsWith('/tabs');
    this.loadKpi();
  }

  onFieldFocus(event: any) {
    const el = event?.target as HTMLElement;
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 250);
    }
  }

  /**
   * Muat ringkasan KPI dari backend
   */
  loadKpi() {
    this.isLoadingKpi = true;
    this.businessCardService.getKpi().subscribe({
      next: (res) => {
        this.isLoadingKpi = false;
        if (res?.data) {
          this.kpi = res.data;
        }
      },
      error: (err) => {
        this.isLoadingKpi = false;
        console.warn('Gagal memuat KPI kartu nama:', err);
      }
    });
  }

  /**
   * Mengambil koordinat GPS saat ini
   */
  async getLocation() {
    try {
      const position: any = await Promise.race([
        Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 2500
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GPS_TIMEOUT')), 3000))
      ]);
      if (position?.coords) {
        this.formData.latitude = position.coords.latitude.toString();
        this.formData.longitude = position.coords.longitude.toString();
      }
    } catch {
      try {
        const coarsePos: any = await Promise.race([
          Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 1500
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('GPS_COARSE_TIMEOUT')), 2000))
        ]);
        if (coarsePos?.coords) {
          this.formData.latitude = coarsePos.coords.latitude.toString();
          this.formData.longitude = coarsePos.coords.longitude.toString();
        }
      } catch (e2) {
        console.warn('GPS tidak tersedia:', e2);
      }
    }
  }

  /**
   * Pilihan sumber foto bukti kartu nama: Kamera langsung atau Galeri foto
   */
  async takePicture() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Foto Bukti Kartu Nama',
      subHeader: 'Foto wajib diambil tidak lebih dari 1 minggu yang lalu',
      buttons: [
        {
          text: 'Ambil Foto Kamera',
          icon: 'camera-outline',
          handler: () => {
            this.processPhoto(CameraSource.Camera);
          }
        },
        {
          text: 'Pilih dari Galeri Foto',
          icon: 'image-outline',
          handler: () => {
            this.processPhoto(CameraSource.Photos);
          }
        },
        {
          text: 'Batal',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Proses foto dari kamera / galeri dengan validasi batas usia foto maksimal 7 hari
   */
  async processPhoto(source: CameraSource) {
    try {
      const detailed = await captureDetailedPhoto({
        source,
        direction: CameraDirection.Rear,
        maxWidth: 720,
        quality: 0.50,
        promptHeader: 'Foto Bukti Kartu Nama'
      });

      if (!detailed) return;

      // Validasi batas umur foto maksimal 7 hari jika dari galeri
      if (source === CameraSource.Photos) {
        if (detailed.hasExifDate && detailed.isOlderThan7Days) {
          const alert = await this.alertCtrl.create({
            header: 'Foto Melebihi 7 Hari',
            subHeader: `Foto terdeteksi diambil ${detailed.daysAgo} hari yang lalu`,
            message: 'Sistem menolak foto yang diambil lebih dari 1 minggu yang lalu untuk menjaga keaslian data kartu nama. Harap ambil foto terbaru atau potret langsung menggunakan kamera.',
            buttons: ['Mengerti']
          });
          await alert.present();
          return;
        }

        if (!detailed.hasExifDate) {
          await this.showToast('Foto tidak memiliki tanggal asli (misal: unduhan WA / screenshot). Tanggal dicatat hari ini.', 'warning');
        } else {
          const labelHari = detailed.daysAgo === 0 ? 'hari ini' : `${detailed.daysAgo} hari lalu`;
          await this.showToast(`Foto galeri valid (diambil ${labelHari}).`, 'success');
        }
      }

      this.previewImage = detailed.dataUrl;
      this.formData.photo = detailed.dataUrl;

      // Ambil titik koordinat otomatis saat foto berhasil diambil
      this.getLocation();
    } catch (error) {
      console.error('Kamera/galeri dibatalkan atau terjadi error:', error);
    }
  }

  /**
   * Helper validasi per-field
   */
  get isNameValid(): boolean {
    return !!(this.formData.customer_name && this.formData.customer_name.trim().length >= 2);
  }

  get isPhoneValid(): boolean {
    if (!this.formData.customer_phone) return false;
    const cleaned = this.formData.customer_phone.replace(/[^0-9+]/g, '');
    const phoneRegex = /^(^\+62|62|^08)(\d{8,13})$/;
    return phoneRegex.test(cleaned);
  }

  get isPhotoValid(): boolean {
    return !!this.formData.photo;
  }

  /**
   * Validasi kelengkapan form
   */
  get isFormValid(): boolean {
    return this.isNameValid && this.isPhoneValid && this.isPhotoValid && !this.isSubmitting;
  }

  /**
   * Kirim bukti penyerahan kartu nama ke backend
   */
  async submitCard() {
    if (!this.formData.customer_name?.trim()) {
      return this.showToast('Nama warung / calon pelanggan wajib diisi!', 'warning');
    }

    const cleanedPhone = this.formData.customer_phone.replace(/[^0-9+]/g, '');
    const phoneRegex = /^(^\+62|62|^08)(\d{8,13})$/;
    if (!phoneRegex.test(cleanedPhone)) {
      return this.showToast('Format nomor HP harus standar Indonesia (contoh: 081234567890)', 'warning');
    }

    if (!this.formData.photo) {
      return this.showToast('Foto bukti penyerahan kartu nama wajib dilampirkan!', 'warning');
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Mengirim data prospek...',
      spinner: 'crescent'
    });
    await loading.present();

    const payload = {
      customer_name: this.formData.customer_name.trim(),
      customer_phone: cleanedPhone,
      address: this.formData.address?.trim() || undefined,
      notes: this.formData.notes?.trim() || undefined,
      photo: this.formData.photo,
      latitude: this.formData.latitude ? parseFloat(this.formData.latitude) : undefined,
      longitude: this.formData.longitude ? parseFloat(this.formData.longitude) : undefined
    };

    this.businessCardService.submitBusinessCard(payload).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.isSubmitting = false;

        const currentWeek = res?.data?.current_week_count ?? (this.kpi.week_achieved + 1);
        this.showToast(`Sukses! Kartu nama tercatat (${currentWeek}/7 minggu ini).`, 'success');

        // Reset form agar driver bisa input lagi
        this.resetForm();

        // Refresh KPI
        this.loadKpi();
      },
      error: async (err) => {
        await loading.dismiss();
        this.isSubmitting = false;
        console.error('Error submit kartu nama:', err);

        let errorMsg = 'Gagal menyimpan bukti kartu nama.';
        if (err?.error?.message) {
          errorMsg = err.error.message;
        } else if (err?.message) {
          errorMsg = err.message;
        }

        this.showToast(errorMsg, 'danger');
      }
    });
  }

  resetForm() {
    this.formData = {
      customer_name: '',
      customer_phone: '',
      address: '',
      notes: '',
      latitude: '',
      longitude: '',
      photo: ''
    };
    this.previewImage = undefined;
    this.showOptional = false;
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
