import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonProgressBar,
  IonRefresher, IonRefresherContent, IonSpinner, IonItem, IonList,
  IonModal, IonTextarea, ToastController, LoadingController, AlertController,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, checkmarkCircleOutline, alertCircleOutline, bicycleOutline,
  flashOutline, documentTextOutline, chevronForwardOutline, calendarOutline,
  sparklesOutline, refreshOutline, shieldCheckmarkOutline, eyeOutline,
  closeOutline, warningOutline, checkmarkDoneCircleOutline, locationOutline,
  storefrontOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchService } from 'src/app/services/branch.service';
import { AudioNotificationService } from 'src/app/services/audio-notification.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import {
  Branch,
  ChecksheetIncidentalData,
  ChecksheetSlot,
  ChecksheetTodayData,
  ChecksheetVehicleStatus
} from 'src/app/types/api.types';

@Component({
  selector: 'app-ko-checksheets',
  templateUrl: './ko-checksheets.page.html',
  styleUrls: ['./ko-checksheets.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSegment, IonSegmentButton, IonLabel, IonBadge, IonProgressBar,
    IonRefresher, IonRefresherContent, IonSpinner, IonItem, IonList,
    IonModal, IonTextarea
  ]
})
export class KoChecksheetsPage implements OnInit, OnDestroy {
  private koService = inject(KoOperationsService);
  private branchService = inject(BranchService);
  private audioService = inject(AudioNotificationService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);

  @ViewChild('dateInput') dateInputElement?: ElementRef<HTMLInputElement>;

  selectedDate = this.getTodayDateString();
  selectedTab: 'pagi' | 'siang' | 'sore' | 'malam' | 'insidental' = 'pagi';

  // Multi-Cabang Filter
  branches: Branch[] = [];
  selectedBranchId: number | 'all' = 'all';

  isLoading = true;
  errorMsg = '';

  todayData: ChecksheetTodayData | null = null;
  incidentalData: ChecksheetIncidentalData | null = null;

  // State Modal Verifikasi Inspeksi KO
  isVerifyModalOpen = false;
  selectedVehicleForVerify: ChecksheetVehicleStatus | null = null;
  verifyNotes = '';
  isVerifying = false;

  // Tracker Deteksi Inspeksi Driver Baru & Notifikasi Suara In-App
  private knownSubmissionIds = new Set<number>();
  private isFirstLoad = true;
  private pollInterval: any = null;

  constructor() {
    addIcons({
      timeOutline, checkmarkCircleOutline, alertCircleOutline, bicycleOutline,
      flashOutline, documentTextOutline, chevronForwardOutline, calendarOutline,
      sparklesOutline, refreshOutline, shieldCheckmarkOutline, eyeOutline,
      closeOutline, warningOutline, checkmarkDoneCircleOutline, locationOutline,
      storefrontOutline
    });
  }

  ngOnInit() {
    this.selectInitialPhaseByHour();
    this.branchService.getBranches().subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.branches = res.data;
        }
      },
      error: () => {}
    });
  }

  onBranchFilterChanged() {
    this.loadAll();
  }

  ngOnDestroy() {
    this.stopLiveInspectionPolling();
  }

  ionViewWillEnter() {
    this.loadAll();
    this.startLiveInspectionPolling();
  }

  ionViewWillLeave() {
    this.stopLiveInspectionPolling();
  }

  private selectInitialPhaseByHour() {
    const hour = new Date().getHours();
    if (hour >= 20) {
      this.selectedTab = 'malam';
    } else if (hour >= 15) {
      this.selectedTab = 'sore';
    } else if (hour >= 11) {
      this.selectedTab = 'siang';
    } else {
      this.selectedTab = 'pagi';
    }
  }

  private getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadAll(event?: any) {
    if (!event && !this.todayData) this.isLoading = true;
    this.errorMsg = '';

    this.koService.getTodayChecksheets(this.selectedDate, this.selectedBranchId).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.processTodayDataAndDetectNewInspections(res.data);
          // Jika shift siang dan tab masih di pagi, otomatis geser ke tab siang/sesi aktif
          if (this.todayData?.active_shift === 'siang' && this.selectedTab === 'pagi') {
            const hour = new Date().getHours();
            this.selectedTab = hour >= 20 ? 'malam' : (hour >= 15 ? 'sore' : 'siang');
          }
        } else {
          this.errorMsg = res?.message || 'Gagal memuat checksheet.';
        }
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Gagal terhubung ke server.';
        if (event) event.target.complete();
      }
    });

    this.koService.getIncidentalChecksheets().subscribe({
      next: (res) => {
        if (res?.success) {
          this.incidentalData = res.data;
        }
      },
      error: () => {
        // Non-fatal
      }
    });
  }

  // ==========================================
  // POLLING LIVE INSPEKSI & SOUND ALERT (IN-APP)
  // ==========================================
  private startLiveInspectionPolling() {
    this.stopLiveInspectionPolling();
    this.pollInterval = setInterval(() => {
      this.checkNewInspectionsSilently();
    }, 15000); // Poll setiap 15 detik saat KO sedang aktif di halaman
  }

  private stopLiveInspectionPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private checkNewInspectionsSilently() {
    this.koService.getTodayChecksheets(this.selectedDate, this.selectedBranchId).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.processTodayDataAndDetectNewInspections(res.data);
        }
      },
      error: () => {}
    });
  }

  private processTodayDataAndDetectNewInspections(data: ChecksheetTodayData) {
    this.todayData = data;

    const allCompletedVehicles: ChecksheetVehicleStatus[] = [];
    if (data.phases) {
      const phaseList = [data.phases.pagi, data.phases.siang, data.phases.sore, data.phases.malam || []];
      for (const phaseSlots of phaseList) {
        if (!Array.isArray(phaseSlots)) continue;
        for (const slot of phaseSlots) {
          if (slot.requires_vehicle && Array.isArray(slot.vehicles)) {
            for (const v of slot.vehicles) {
              if (v.completed && v.submission_id) {
                allCompletedVehicles.push(v);
              }
            }
          }
        }
      }
    }

    // Jika bukan load pertama, deteksi inspeksi baru yang belum diverifikasi
    if (!this.isFirstLoad) {
      const newSubmissions = allCompletedVehicles.filter(
        (v) => v.submission_id && !this.knownSubmissionIds.has(v.submission_id) && !v.is_verified
      );

      if (newSubmissions.length > 0) {
        const latest = newSubmissions[0];
        // 1. Bunyikan nada lonceng chime + getar haptic
        this.audioService.playNotificationChime();

        // 2. Munculkan Toast Notifikasi interaktif di atas
        this.toastCtrl.create({
          header: '🔔 Inspeksi Armada Baru!',
          message: `${latest.submitted_by || 'Driver'} telah memeriksa ${latest.name}. Ketuk untuk verifikasi.`,
          position: 'top',
          color: 'primary',
          duration: 7000,
          buttons: [
            {
              text: 'Verifikasi',
              role: 'info',
              handler: () => {
                this.openVerifyModal(latest);
              }
            },
            {
              text: 'Tutup',
              role: 'cancel'
            }
          ]
        }).then(t => t.present());
      }
    }

    // Rekam semua ID submission yang sudah diproses
    for (const v of allCompletedVehicles) {
      if (v.submission_id) {
        this.knownSubmissionIds.add(v.submission_id);
      }
    }

    this.isFirstLoad = false;
  }

  onDateChange() {
    this.loadAll();
  }

  get currentPhaseSlots(): ChecksheetSlot[] {
    if (!this.todayData?.phases || this.selectedTab === 'insidental') {
      return [];
    }
    return this.todayData.phases[this.selectedTab] || [];
  }

  getStatusColor(status: string, slot?: ChecksheetSlot): string {
    if (slot?.is_exempt || status === 'exempt') return 'medium';
    if (slot?.source === 'pos_web_sync' || slot?.pos_synced) return 'success';

    switch (status) {
      case 'done':
        return 'success';
      case 'open':
        return 'primary';
      case 'late':
        return 'warning';
      case 'missed':
        return 'danger';
      case 'needs_owner_review':
        return 'danger';
      case 'upcoming':
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string, slot?: ChecksheetSlot): string {
    if (slot?.is_exempt || status === 'exempt') {
      return slot?.exempt_reason || 'Dilewati (Shift)';
    }
    if (slot?.source === 'pos_web_sync' || slot?.pos_synced) {
      return 'Selesai (POS Web)';
    }

    switch (status) {
      case 'done':
        return 'Selesai';
      case 'open':
        return 'Dibuka';
      case 'late':
        return 'Terlambat';
      case 'missed':
        return 'Terlewat';
      case 'needs_owner_review':
        return 'Review Owner';
      case 'upcoming':
        return 'Akan Datang';
      default:
        return status;
    }
  }

  openDatePicker() {
    if (this.dateInputElement?.nativeElement) {
      const el = this.dateInputElement.nativeElement;
      if (typeof (el as any).showPicker === 'function') {
        (el as any).showPicker();
      } else {
        el.click();
      }
    }
  }

  isAutoAttendanceSlot(slot: ChecksheetSlot): boolean {
    return slot.slug === 'kasir-presensi-buka-depot' || slot.source === 'auto';
  }

  canFillSlot(slot: ChecksheetSlot): boolean {
    if (slot.requires_vehicle) return false;
    if (slot.is_exempt || slot.status === 'exempt') return false;
    if (slot.source === 'pos_web_sync' || slot.pos_synced) return false;
    if (slot.status === 'done') return false;
    // Slot otomatis dari presensi diselesaikan otomatis saat check-in, bukan form manual
    if (this.isAutoAttendanceSlot(slot)) return false;
    return slot.status === 'open' || slot.status === 'late' || slot.status === 'missed' || slot.status === 'upcoming';
  }

  onCardClicked(slot: ChecksheetSlot) {
    if (this.canFillSlot(slot)) {
      this.openSlotForm(slot);
    }
  }

  goToAttendance() {
    this.navCtrl.navigateRoot('/tabs/ko/attendance');
  }

  openSlotForm(slot: ChecksheetSlot) {
    this.router.navigate(['/tabs/ko/checksheets/form', slot.slug], {
      queryParams: {
        mode: 'ko',
        form_schedule_id: slot.form_schedule_id || slot.id || undefined,
      },
    });
  }

  openVehicleInspection(slot: ChecksheetSlot, vehicle: ChecksheetVehicleStatus) {
    this.router.navigate(['/tabs/ko/checksheets/form', slot.slug], {
      queryParams: {
        mode: 'ko',
        form_schedule_id: slot.form_schedule_id || slot.id || undefined,
        vehicle_id: vehicle.vehicle_id || vehicle.id,
      },
    });
  }

  openIncidentalForm(slug: string) {
    this.router.navigate(['/tabs/ko/checksheets/form', slug], {
      queryParams: { mode: 'ko' },
    });
  }

  openHistory() {
    this.navCtrl.navigateForward('/tabs/ko/checksheets/history');
  }

  doRefresh(event: any) {
    this.loadAll(event);
  }

  // ==========================================
  // MODAL VERIFIKASI INSPEKSI ARMADA OLEH KO
  // ==========================================
  openVerifyModal(vehicle: ChecksheetVehicleStatus) {
    this.selectedVehicleForVerify = vehicle;
    this.verifyNotes = vehicle.review_notes || '';
    this.isVerifyModalOpen = true;
  }

  closeVerifyModal() {
    this.isVerifyModalOpen = false;
    this.selectedVehicleForVerify = null;
    this.verifyNotes = '';
  }

  async submitVerification(decision: 'approved' | 'needs_review') {
    if (!this.selectedVehicleForVerify?.submission_id) {
      const toast = await this.toastCtrl.create({
        message: 'Data submission inspeksi tidak memiliki ID yang valid.',
        duration: 2500,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const subId = this.selectedVehicleForVerify.submission_id;
    const isLowFuel = this.isFuelBelowHalf(this.selectedVehicleForVerify?.answers?.['fuel_level']?.value_text);
    this.isVerifying = true;
    const loading = await this.loadingCtrl.create({
      message: decision === 'approved' ? 'Menyetujui verifikasi armada...' : 'Menandai catatan perbaikan...'
    });
    await loading.present();

    this.koService.verifyInspection(subId, {
      status: decision,
      review_notes: this.verifyNotes ? this.verifyNotes.trim() : undefined
    }).subscribe({
      next: async () => {
        this.isVerifying = false;
        await loading.dismiss();
        this.closeVerifyModal();

        const fuelMsg = (decision === 'approved' && isLowFuel) ? ' (⚠️ Reminder: Bensin armada < 1/2, pastikan bensin diisi!)' : '';
        const toast = await this.toastCtrl.create({
          message: decision === 'approved'
            ? 'Armada berhasil diverifikasi & disetujui! ✅' + fuelMsg
            : 'Catatan perbaikan berhasil disimpan ⚠️',
          duration: isLowFuel ? 4500 : 3000,
          color: decision === 'approved' ? (isLowFuel ? 'warning' : 'success') : 'warning'
        });
        await toast.present();
        this.loadAll();
      },
      error: async (err) => {
        this.isVerifying = false;
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: err.error?.message || 'Gagal menyimpan verifikasi.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  isFuelBelowHalf(level?: string | null): boolean {
    if (!level) return false;
    const l = level.toLowerCase().trim();
    return l.includes('1/4') || l.includes('habis') || l === '0%' || l === '25%';
  }
}
