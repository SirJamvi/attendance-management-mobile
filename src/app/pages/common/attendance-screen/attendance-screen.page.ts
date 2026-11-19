import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
  IonBadge, IonGrid, IonRow, IonCol, IonModal, IonTextarea,
  IonRefresher, IonRefresherContent,
  AlertController, LoadingController, ToastController, Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline,
  timeOutline, alertCircleOutline, warningOutline, flame, giftOutline,
  lockClosedOutline, lockOpenOutline, chevronForwardOutline, shieldCheckmarkOutline,
  cubeOutline, podiumOutline, speedometerOutline, clipboardOutline,
  checkmarkDoneOutline, statsChartOutline, closeOutline, trashOutline, warning
} from 'ionicons/icons';
import { Geolocation, Position } from '@capacitor/geolocation';

import { CameraViewComponent } from '../../../components/camera-view/camera-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';
import { BranchBadgeComponent } from '../../../components/branch-badge/branch-badge.component';
import { AttendanceService } from '../../../services/attendance';
import { AuthService } from '../../../services/auth';

import {
  Attendance,
  CheckoutEligibility,
  CheckoutRequirement,
  User
} from '../../../types/api.types';

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
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonIcon, IonSpinner, IonItem, IonLabel, IonNote, IonList,
    IonBadge, IonGrid, IonRow, IonCol, IonModal, IonTextarea,
    IonRefresher, IonRefresherContent
  ]
})
export class AttendanceScreenPage implements OnInit, OnDestroy {

  isLoading = true;
  attendanceToday: Attendance | null = null;
  currentUser: User | null = null;
  userRole = '';

  shiftInfo: any = null;
  isDayOff = false;
  currentDayName = '';
  emergencyNote = '';

  hasSevereWarning = false;
  warningMessage = '';

  photoData: string | null = null;
  locationData: { latitude: number; longitude: number } | null = null;
  isSubmitDisabled = true;

  // Driver Gatekeeper Check-Out Eligibility
  checkoutEligibility: CheckoutEligibility | null = null;
  isBlockedModalOpen = false;
  blockedModalMessage = '';
  blockedRequirements: CheckoutRequirement[] = [];

  // Driver Active Missions
  activeMissions: any[] = [];

  private subs = new Subscription();

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private platform: Platform
  ) {
    addIcons({
      cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline,
      timeOutline, alertCircleOutline, warningOutline, flame, giftOutline,
      lockClosedOutline, lockOpenOutline, chevronForwardOutline, shieldCheckmarkOutline,
      cubeOutline, podiumOutline, speedometerOutline, clipboardOutline,
      checkmarkDoneOutline, statsChartOutline, closeOutline, trashOutline, warning
    });
  }

  ngOnInit() {
    this.subs.add(
      this.authService.getCurrentUser().subscribe((user) => {
        this.currentUser = user;
        this.userRole = user?.role || '';
      })
    );

    this.subs.add(
      this.attendanceService.checkoutEligibility$.subscribe((eligibility) => {
        this.checkoutEligibility = eligibility;
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  ionViewWillEnter() {
    this.currentUser = this.authService.getCurrentUserValue();
    this.userRole = this.currentUser?.role || '';
    this.loadStatus();
    this.resetForm();
  }

  get isDriver(): boolean {
    return this.userRole === 'driver';
  }

  get isKoOrKasir(): boolean {
    return this.authService.isKoRole(this.userRole);
  }

  get isCheckoutLocked(): boolean {
    if (!this.isDriver || !this.checkoutEligibility) {
      return false;
    }
    if (this.checkoutEligibility.bypass_applied) {
      return false;
    }
    return this.checkoutEligibility.can_checkout === false;
  }

  doRefresh(event: any) {
    this.loadStatus(event);
  }

  async loadStatus(event?: any) {
    if (!event && !this.attendanceToday && !this.shiftInfo) {
      this.isLoading = true;
    }
    this.attendanceService.getStatus().subscribe({
      next: (response) => {
        this.attendanceToday = response.data;

        if (response.meta) {
          this.shiftInfo = response.meta.shift_name
            ? {
                name: response.meta.shift_name,
                start: response.meta.shift_start,
                end: response.meta.shift_end,
              }
            : null;
          this.isDayOff = !!response.meta.is_day_off;
          this.currentDayName = response.meta.current_day || '';
          this.hasSevereWarning = !!response.meta.severe_warning;
          this.warningMessage = response.meta.warning_message || '';

          if ('checkout_eligibility' in response.meta) {
            this.checkoutEligibility = response.meta.checkout_eligibility ?? null;
          }
        }

        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err: any) => {
        this.isLoading = false;
        if (event) event.target.complete();
        console.error('Error loading status:', err);
      }
    });

    if (this.isDriver) {
      this.attendanceService.getActiveMissions().subscribe({
        next: (res: any) => {
          if (res && Array.isArray(res.data)) {
            this.activeMissions = res.data;
          } else {
            this.activeMissions = [];
          }
        },
        error: () => {
          this.activeMissions = [];
        }
      });
    } else {
      this.activeMissions = [];
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
        timeout: 6000,
      });
      this.locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error: any) {
      console.warn('GPS High accuracy failed, trying coarse fallback...', error);
      try {
        const fallbackPos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 4000,
        });
        this.locationData = {
          latitude: fallbackPos.coords.latitude,
          longitude: fallbackPos.coords.longitude,
        };
      } catch (e2) {
        console.error('GPS Fallback Error', e2);
        this.showAlert('Gagal Lokasi', 'Pastikan GPS perangkat Anda aktif.');
        this.locationData = null;
      }
    }
  }

  checkFormState() {
    this.isSubmitDisabled = !(this.photoData && this.locationData);
  }

  resetForm() {
    this.photoData = null;
    this.locationData = null;
    this.emergencyNote = '';
    this.isSubmitDisabled = true;
  }

  navigateToRequirement(req: CheckoutRequirement) {
    this.isBlockedModalOpen = false;
    if (req.key === 'vehicle_fuel_inspection' || req.action_slug === 'shared-inspeksi-bensin-armada') {
      const slug = req.action_slug || 'shared-inspeksi-bensin-armada';
      this.router.navigate(['/tabs/driver/inspection/form', slug]);
      return;
    }
    if (req.key === 'daily_delivery_report') {
      this.router.navigate(['/tabs/driver/bulk-delivery']);
      return;
    }
    if (req.action_slug) {
      this.router.navigate(['/tabs/driver/inspection/form', req.action_slug]);
    } else {
      this.router.navigate(['/tabs/driver/inspection']);
    }
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
      this.locationData!.longitude,
      this.isDayOff ? this.emergencyNote : undefined
    ).subscribe({
      next: async (response) => {
        await loading.dismiss();

        const hasAutoChecksheet = !!(response?.data as any)?.auto_checksheet;
        if (this.isKoOrKasir && hasAutoChecksheet) {
          await this.showToast(
            'Presensi masuk berhasil & Checksheet Buka Depot Pagi otomatis selesai!',
            'success',
            4000
          );
        } else {
          const message = this.isDayOff
            ? 'Presensi darurat berhasil dikirim. Menunggu validasi Admin.'
            : 'Absen Masuk Tercatat!';
          await this.showAlert('Berhasil', message);
        }

        this.loadStatus();
        this.resetForm();
      },
      error: async (err: any) => {
        await loading.dismiss();
        this.showAlert('Gagal', err.error?.message || 'Gagal mengirim data.');
      }
    });
  }

  async submitCheckOut() {
    if (this.isSubmitDisabled || this.isCheckoutLocked) return;

    const loading = await this.loadingCtrl.create({ message: 'Mengirim Absen Pulang...' });
    await loading.present();

    this.attendanceService.checkOut(
      this.photoData!,
      this.locationData!.latitude,
      this.locationData!.longitude
    ).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.showAlert('Berhasil', 'Absen Pulang Tercatat!');
        this.loadStatus();
        this.resetForm();
      },
      error: async (err: any) => {
        await loading.dismiss();

        if (err.status === 422 && err.error?.data?.code === 'DRIVER_CHECKOUT_BLOCKED') {
          this.blockedModalMessage =
            err.error?.message || 'Absen pulang belum dapat dilakukan sebelum syarat harian terpenuhi.';
          const allReqs: CheckoutRequirement[] = err.error?.data?.requirements || [];
          this.blockedRequirements = allReqs.filter((r) => !r.completed);
          if (err.error?.data?.checkout_eligibility) {
            this.attendanceService.updateCheckoutEligibility(err.error.data.checkout_eligibility);
          }
          this.isBlockedModalOpen = true;
          return;
        }

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

  async showToast(message: string, color: 'success' | 'warning' | 'danger', duration = 3000) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration,
      position: 'top',
    });
    await toast.present();
  }
}
