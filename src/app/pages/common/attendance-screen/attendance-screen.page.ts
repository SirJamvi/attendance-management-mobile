import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
  IonBackButton, IonIcon, IonSpinner, IonModal, IonTextarea,
  IonRefresher, IonRefresherContent,
  AlertController, LoadingController, ToastController, Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline, checkmarkCircle, checkmarkDoneCircle, calendarOutline,
  timeOutline, alertCircleOutline, warningOutline, flame, giftOutline,
  lockClosedOutline, lockOpenOutline, chevronForwardOutline, shieldCheckmarkOutline,
  cubeOutline, podiumOutline, speedometerOutline, clipboardOutline,
  checkmarkDoneOutline, statsChartOutline, closeOutline, trashOutline, warning,
  sendOutline, checkmark, storefrontOutline, informationCircleOutline, chevronForward,
  personCircleOutline, cardOutline, locationOutline, hourglassOutline
} from 'ionicons/icons';
import { Geolocation, Position } from '@capacitor/geolocation';

import { CameraViewComponent } from '../../../components/camera-view/camera-view.component';
import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';
import { BranchBadgeComponent } from '../../../components/branch-badge/branch-badge.component';
import { BranchSelectModalComponent } from '../../../components/branch-select-modal/branch-select-modal.component';
import { DriverDutySetupModalComponent } from '../../../components/driver-duty-setup-modal/driver-duty-setup-modal.component';
import { AttendanceService } from '../../../services/attendance';
import { AuthService } from '../../../services/auth';
import { BranchService } from '../../../services/branch.service';

import {
  Attendance,
  Branch,
  CheckoutEligibility,
  CheckoutRequirement,
  User,
  OperationalShift
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
    BranchSelectModalComponent,
    DriverDutySetupModalComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonButtons,
    IonBackButton, IonIcon, IonSpinner, IonModal, IonTextarea,
    IonRefresher, IonRefresherContent
  ]
})
export class AttendanceScreenPage implements OnInit, OnDestroy {

  isLoading = true;
  attendanceToday: Attendance | null = null;
  currentUser: User | null = null;
  userRole = '';

  branches: Branch[] = [];
  selectedBranchId: number | null = null;
  isBranchModalOpen = false;

  shiftInfo: any = null;
  isDayOff = false;
  currentDayName = '';
  emergencyNote = '';

  hasSevereWarning = false;
  warningMessage = '';

  // Multi-Sesi Hari Ini (Helper Pagi & Helper Sore)
  previousSessions: any[] = [];
  currentSessionNumber = 1;
  canCheckInNextSession = false;

  photoData: string | null = null;
  locationData: { latitude: number; longitude: number } | null = null;
  isSubmitDisabled = true;
  isSubmitting = false;

  // Driver Gatekeeper Check-Out Eligibility
  checkoutEligibility: CheckoutEligibility | null = null;
  isBlockedModalOpen = false;
  blockedModalMessage = '';
  blockedRequirements: CheckoutRequirement[] = [];

  // Driver Active Missions
  activeMissions: any[] = [];

  // Driver Duty Setup (Cabang & Shift)
  driverShifts: OperationalShift[] = [];
  scheduledShiftId: number | null = null;
  scheduledShiftName: string | null = null;
  selectedShiftId: number | null = null;
  selectedShiftName: string | null = null;
  isDriverDutyModalOpen = false;

  get isShiftMatch(): boolean {
    if (this.isDayOff || !this.scheduledShiftId || !this.selectedShiftId) {
      return false;
    }
    return this.selectedShiftId === this.scheduledShiftId;
  }

  openDriverDutyModal() {
    this.isDriverDutyModalOpen = true;
  }

  closeDriverDutyModal() {
    this.isDriverDutyModalOpen = false;
  }

  async onDriverDutyConfirmedFromModal(event: {
    branch: Branch;
    shift: OperationalShift;
    note?: string;
    isMatch: boolean;
  }) {
    this.isDriverDutyModalOpen = false;
    this.selectedBranchId = event.branch.id;
    this.selectedShiftId = event.shift.id;
    this.selectedShiftName = event.shift.name;
    if (event.note) {
      this.emergencyNote = event.note;
    }

    await this.applyDutyBranchChange(event.branch.id, event.branch.name);
    this.attendanceService.updateDutyShift(event.shift.id, event.note).subscribe({
      next: () => console.log('✅ Duty shift driver diperbarui:', event.shift.name),
      error: (err) => console.warn('⚠️ Gagal sinkron duty shift:', err)
    });

    const toast = await this.toastCtrl.create({
      message: `Shift tugas: ${event.shift.name} (${event.isMatch ? 'Sesuai Jadwal' : 'Validasi Admin'})`,
      duration: 2500,
      color: event.isMatch ? 'success' : 'warning',
      position: 'bottom'
    });
    await toast.present();
  }

  private subs = new Subscription();

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private branchService: BranchService,
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
      checkmarkDoneOutline, statsChartOutline, closeOutline, trashOutline, warning,
      sendOutline, checkmark, storefrontOutline, informationCircleOutline, chevronForward,
      personCircleOutline, locationOutline, hourglassOutline
    });
  }

  get userDisplayName(): string {
    return this.currentUser?.name || this.currentUser?.username || 'Rekan';
  }

  openBranchModal() {
    this.isBranchModalOpen = true;
  }

  closeBranchModal() {
    this.isBranchModalOpen = false;
  }

  async onBranchSelectedFromModal(branch: Branch) {
    this.isBranchModalOpen = false;
    await this.applyDutyBranchChange(branch.id, branch.name);
    const toast = await this.toastCtrl.create({
      message: `Cabang tugas aktif: ${branch.name}`,
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  async onBranchChange(event: any) {
    const branchId = Number(event?.detail?.value ?? event);
    if (branchId) {
      await this.applyDutyBranchChange(branchId);
    }
  }

  async applyDutyBranchChange(branchId: number, branchName?: string) {
    this.selectedBranchId = branchId;
    const branch = this.branches.find(b => b.id === branchId);
    const resolvedName = branchName || branch?.name || '';

    // 1. Reaktivitas Header Badge: Langsung update local auth state detik itu juga agar app-branch-badge seketika berganti
    await this.authService.updateUserBranch(branchId, resolvedName);

    // 2. Sinkronkan cabang tugas ke backend via POST /api/v1/attendance/duty-branch
    this.attendanceService.updateDutyBranch(branchId).subscribe({
      next: (res) => {
        console.log('✅ Duty branch berhasil disinkronkan ke backend:', res);
      },
      error: (err) => {
        console.warn('⚠️ Gagal update duty branch ke backend:', err);
      }
    });
  }

  get showActionBar(): boolean {
    if (this.isLoading) return false;
    return !this.attendanceToday || !this.attendanceToday.check_out_time;
  }

  get completedRequirementsCount(): number {
    return this.checkoutEligibility?.requirements?.filter(r => r.completed).length || 0;
  }

  get totalRequirementsCount(): number {
    return this.checkoutEligibility?.requirements?.length || 0;
  }

  get requirementsProgressPercent(): number {
    if (!this.totalRequirementsCount) return 0;
    return Math.round((this.completedRequirementsCount / this.totalRequirementsCount) * 100);
  }

  get helpText(): string {
    if (this.attendanceToday && this.isCheckoutLocked) {
      return 'Selesaikan syarat absen pulang dulu.';
    }
    if (!this.photoData) {
      return 'Ambil foto selfie dulu.';
    }
    if (this.photoData && !this.locationData) {
      return 'Mencari lokasi GPS…';
    }
    return '';
  }

  get selectedBranchName(): string {
    const branch = this.branches.find(b => b.id === this.selectedBranchId);
    return branch ? branch.name : (this.currentUser?.branch_name || '');
  }

  ngOnInit() {
    this.subs.add(
      this.authService.getCurrentUser().subscribe((user) => {
        this.currentUser = user;
        this.userRole = user?.role || '';
        if (!this.selectedBranchId && user?.branch_id) {
          this.selectedBranchId = user.branch_id;
        }
      })
    );

    this.subs.add(
      this.branchService.getBranches().subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.branches = res.data;
            if (!this.selectedBranchId && this.currentUser?.branch_id) {
              this.selectedBranchId = this.currentUser.branch_id;
            } else if (!this.selectedBranchId && this.branches.length > 0) {
              this.selectedBranchId = this.branches[0].id;
            }
          }
        },
        error: (err) => console.warn('Gagal memuat cabang:', err)
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
        if (response.data?.branch_id) {
          this.selectedBranchId = response.data.branch_id;
        }

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

          if (response.meta.duty_branch_id) {
            this.selectedBranchId = response.meta.duty_branch_id;
            if (response.meta.duty_branch_name) {
              this.authService.updateUserBranch(response.meta.duty_branch_id, response.meta.duty_branch_name);
            }
          }

          if (response.meta.duty_shift_id) {
            this.selectedShiftId = response.meta.duty_shift_id;
            this.selectedShiftName = response.meta.duty_shift_name || null;
          }

          this.previousSessions = response.meta.previous_sessions || [];
          this.currentSessionNumber = response.meta.current_session_number || (this.previousSessions.length + 1);
          this.canCheckInNextSession = !!response.meta.can_check_in_next_session;
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
      this.attendanceService.getShifts().subscribe({
        next: (sRes) => {
          if (sRes?.data?.shifts && sRes.data.shifts.length > 0) {
            this.driverShifts = sRes.data.shifts;
            this.scheduledShiftId = sRes.data.today_scheduled_shift_id;
            this.scheduledShiftName = sRes.data.today_scheduled_shift?.name || null;
            if (!this.selectedShiftId && sRes.data.selected_duty_shift_id) {
              this.selectedShiftId = sRes.data.selected_duty_shift_id;
              this.selectedShiftName = this.driverShifts.find((s) => Number(s.id) === Number(this.selectedShiftId))?.name || null;
            } else if (!this.selectedShiftId && this.scheduledShiftId) {
              this.selectedShiftId = this.scheduledShiftId;
              this.selectedShiftName = this.scheduledShiftName;
            }
          } else {
            this.driverShifts = this.getDefaultShifts();
            if (!this.selectedShiftId) {
              this.selectedShiftId = this.driverShifts[0].id;
              this.selectedShiftName = this.driverShifts[0].name;
            }
          }
        },
        error: (err) => {
          console.warn('Gagal memuat shift di attendance screen, memakai default:', err);
          this.driverShifts = this.getDefaultShifts();
          if (!this.selectedShiftId) {
            this.selectedShiftId = this.driverShifts[0].id;
            this.selectedShiftName = this.driverShifts[0].name;
          }
        }
      });

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
    if (this.isSubmitDisabled || this.isSubmitting) return;

    this.isSubmitting = true;
    const isUnscheduled = this.isDayOff || (!this.isShiftMatch && this.isDriver);
    const loading = await this.loadingCtrl.create({
      message: isUnscheduled ? 'Mengirim Presensi (Di Luar Jadwal)...' : 'Mengirim Absen Masuk...'
    });
    await loading.present();

    const noteToSend = isUnscheduled ? (this.emergencyNote || undefined) : undefined;

    this.attendanceService.checkIn(
      this.photoData!,
      this.locationData!.latitude,
      this.locationData!.longitude,
      noteToSend,
      this.selectedBranchId,
      this.selectedShiftId
    ).subscribe({
      next: async (response) => {
        this.isSubmitting = false;
        await loading.dismiss();

        if (this.selectedBranchId) {
          const selected = this.branches.find(b => b.id === this.selectedBranchId);
          if (selected) {
            await this.authService.updateUserBranch(selected.id, selected.name);
          }
        }

        const hasAutoChecksheet = !!(response?.data as any)?.auto_checksheet;
        if (this.isKoOrKasir && hasAutoChecksheet) {
          await this.showToast(
            'Presensi masuk berhasil & Checksheet Buka Depot Pagi otomatis selesai!',
            'success',
            4000
          );
        } else {
          const message = isUnscheduled
            ? 'Presensi mandiri (di luar jadwal) berhasil dicatat. Menunggu validasi Admin di Dashboard Web.'
            : 'Absen Masuk Tercatat!';
          await this.showAlert('Berhasil', message);
        }

        this.loadStatus();
        this.resetForm();
      },
      error: async (err: any) => {
        this.isSubmitting = false;
        await loading.dismiss();
        this.showAlert('Gagal', err.error?.message || 'Gagal mengirim data.');
      }
    });
  }

  async submitCheckOut() {
    if (this.isSubmitDisabled || this.isCheckoutLocked || this.isSubmitting) return;

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim Absen Pulang...' });
    await loading.present();

    this.attendanceService.checkOut(
      this.photoData!,
      this.locationData!.latitude,
      this.locationData!.longitude
    ).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await loading.dismiss();
        await this.showAlert('Berhasil', 'Absen Pulang Tercatat!');
        this.loadStatus();
        this.resetForm();
      },
      error: async (err: any) => {
        this.isSubmitting = false;
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

  private getDefaultShifts(): OperationalShift[] {
    return [
      { id: 1, name: 'Shift 1 (Pagi)', start_time: '07:20:00', end_time: '15:20:00', daily_wage: 60000 },
      { id: 3, name: 'Helper Pagi', start_time: '07:20:00', end_time: '12:00:00', daily_wage: 30000, is_helper: true },
      { id: 2, name: 'Shift 2 (09:40)', start_time: '09:40:00', end_time: '17:40:00', daily_wage: 60000 },
      { id: 6, name: 'Shift 2 (12:00)', start_time: '12:00:00', end_time: '20:00:00', daily_wage: 60000 },
      { id: 4, name: 'Helper Sore', start_time: '16:30:00', end_time: '22:00:00', daily_wage: 30000, is_helper: true },
      { id: 5, name: 'Helper Rangkap (Pagi + Sore)', start_time: '07:20:00', end_time: '22:00:00', daily_wage: 60000, is_rangkap: true },
    ];
  }
}
