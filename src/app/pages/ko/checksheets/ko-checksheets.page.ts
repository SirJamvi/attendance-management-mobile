import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonProgressBar,
  IonRefresher, IonRefresherContent, IonSpinner, IonItem, IonList,
  IonModal, IonTextarea, ToastController, LoadingController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, checkmarkCircleOutline, alertCircleOutline, bicycleOutline,
  flashOutline, documentTextOutline, chevronForwardOutline, calendarOutline,
  sparklesOutline, refreshOutline, shieldCheckmarkOutline, eyeOutline,
  closeOutline, warningOutline, checkmarkDoneCircleOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import {
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
export class KoChecksheetsPage implements OnInit {
  private koService = inject(KoOperationsService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);

  selectedDate = this.getTodayDateString();
  selectedTab: 'pagi' | 'siang' | 'sore' | 'malam' | 'insidental' = 'pagi';

  isLoading = true;
  errorMsg = '';

  todayData: ChecksheetTodayData | null = null;
  incidentalData: ChecksheetIncidentalData | null = null;

  // State Modal Verifikasi Inspeksi KO
  isVerifyModalOpen = false;
  selectedVehicleForVerify: ChecksheetVehicleStatus | null = null;
  verifyNotes = '';
  isVerifying = false;

  constructor() {
    addIcons({
      timeOutline, checkmarkCircleOutline, alertCircleOutline, bicycleOutline,
      flashOutline, documentTextOutline, chevronForwardOutline, calendarOutline,
      sparklesOutline, refreshOutline, shieldCheckmarkOutline, eyeOutline,
      closeOutline, warningOutline, checkmarkDoneCircleOutline
    });
  }

  ngOnInit() {
    this.selectInitialPhaseByHour();
  }

  ionViewWillEnter() {
    this.loadAll();
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

    this.koService.getTodayChecksheets(this.selectedDate).subscribe({
      next: (res) => {
        if (res?.success) {
          this.todayData = res.data;
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

  isAutoAttendanceSlot(slot: ChecksheetSlot): boolean {
    return slot.slug === 'kasir-presensi-buka-depot' || slot.source === 'auto';
  }

  canFillSlot(slot: ChecksheetSlot): boolean {
    if (slot.requires_vehicle) return false;
    if (slot.is_exempt || slot.status === 'exempt') return false;
    if (slot.source === 'pos_web_sync' || slot.pos_synced) return false;
    if (this.isAutoAttendanceSlot(slot) && (slot.status === 'done' || slot.status === 'late')) {
      return false;
    }
    return slot.status === 'open' || slot.status === 'late' || slot.status === 'upcoming';
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
    this.router.navigate(['/tabs/ko/checksheets/history']);
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

        const toast = await this.toastCtrl.create({
          message: decision === 'approved'
            ? 'Armada berhasil diverifikasi & disetujui! ✅'
            : 'Catatan perbaikan berhasil disimpan ⚠️',
          duration: 3000,
          color: decision === 'approved' ? 'success' : 'warning'
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
}
