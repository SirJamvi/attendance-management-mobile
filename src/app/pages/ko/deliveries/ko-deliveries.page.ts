import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonRefresher, IonRefresherContent,
  IonSpinner, IonModal, IonTextarea, IonInput, IonItem,
  AlertController, LoadingController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, checkmarkCircleOutline, closeCircleOutline, warningOutline,
  shieldCheckmarkOutline, alertCircleOutline, eyeOutline, cashOutline,
  cubeOutline, personOutline, closeOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { KoDeliveryItem, PosCrossCheckDriver } from 'src/app/types/api.types';

@Component({
  selector: 'app-ko-deliveries',
  templateUrl: './ko-deliveries.page.html',
  styleUrls: ['./ko-deliveries.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSegment, IonSegmentButton, IonLabel, IonBadge, IonRefresher, IonRefresherContent,
    IonSpinner, IonModal, IonTextarea, IonInput, IonItem
  ]
})
export class KoDeliveriesPage implements OnInit {
  private koService = inject(KoOperationsService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  selectedDate = this.getTodayDateString();
  selectedStatus: 'pending' | 'approved' | 'rejected' | '' = 'pending';

  isLoading = true;
  errorMsg = '';

  posCrossCheck: PosCrossCheckDriver[] = [];
  deliveries: KoDeliveryItem[] = [];

  // Bypass Check-Out Modal
  isBypassModalOpen = false;
  bypassAttendanceId: number | null = null;
  bypassDriverName = '';
  bypassReason = '';
  isSubmittingBypass = false;

  constructor() {
    addIcons({
      calendarOutline, checkmarkCircleOutline, closeCircleOutline, warningOutline,
      shieldCheckmarkOutline, alertCircleOutline, eyeOutline, cashOutline,
      cubeOutline, personOutline, closeOutline
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadDeliveries();
  }

  private getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  loadDeliveries(event?: any) {
    if (!event && this.deliveries.length === 0 && this.posCrossCheck.length === 0) {
      this.isLoading = true;
    }
    this.errorMsg = '';

    this.koService
      .getDeliveries({
        date: this.selectedDate,
        status: this.selectedStatus || undefined,
      })
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.posCrossCheck = Array.isArray(res.data.pos_cross_check)
              ? res.data.pos_cross_check
              : [];
            this.deliveries = Array.isArray(res.data.deliveries)
              ? res.data.deliveries
              : [];
          } else {
            this.errorMsg = res?.message || 'Gagal memuat data delivery.';
          }
          this.isLoading = false;
          if (event) event.target.complete();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMsg = err.error?.message || 'Gagal memuat data delivery.';
          if (event) event.target.complete();
        }
      });
  }

  async approve(item: KoDeliveryItem) {
    const confirm = await this.alertCtrl.create({
      header: 'Setujui Laporan?',
      message: `Approve pengiriman ${item.driver_name} ke ${item.customer_name} (${item.total_balls} bal)?`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Approve',
          handler: () => {
            this.executeApprove(item.id);
          }
        }
      ]
    });
    await confirm.present();
  }

  private async executeApprove(id: number) {
    const loading = await this.loadingCtrl.create({ message: 'Menyetujui...' });
    await loading.present();

    this.koService.approveDelivery(id).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(res?.message || 'Delivery disetujui!', 'success');
        this.loadDeliveries();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal menyetujui delivery.', 'danger');
      }
    });
  }

  async reject(item: KoDeliveryItem) {
    const alert = await this.alertCtrl.create({
      header: 'Tolak Laporan Delivery',
      subHeader: `${item.driver_name} — ${item.customer_name}`,
      inputs: [
        {
          name: 'rejection_reason',
          type: 'textarea',
          placeholder: 'Masukkan alasan penolakan (wajib)...',
        },
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Tolak',
          cssClass: 'danger',
          handler: (data) => {
            const reason = (data?.rejection_reason || '').trim();
            if (!reason) {
              this.showToast('Alasan penolakan wajib diisi!', 'warning');
              return false;
            }
            this.executeReject(item.id, reason);
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async executeReject(id: number, reason: string) {
    const loading = await this.loadingCtrl.create({ message: 'Menolak laporan...' });
    await loading.present();

    this.koService.rejectDelivery(id, reason).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(res?.message || 'Laporan ditolak.', 'warning');
        this.loadDeliveries();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal menolak laporan.', 'danger');
      }
    });
  }

  openDetail(item: KoDeliveryItem) {
    this.router.navigate(['/tabs/ko/deliveries', item.id]);
  }

  openBypassModal(driver?: PosCrossCheckDriver) {
    this.bypassAttendanceId = driver?.attendance_id ?? null;
    this.bypassDriverName = driver?.driver_name || '';
    this.bypassReason = '';
    this.isBypassModalOpen = true;
  }

  async submitBypass() {
    if (!this.bypassAttendanceId) {
      await this.showToast('ID Presensi driver wajib diisi.', 'warning');
      return;
    }
    if (!this.bypassReason.trim()) {
      await this.showToast('Alasan bypass wajib diisi.', 'warning');
      return;
    }

    this.isSubmittingBypass = true;
    const loading = await this.loadingCtrl.create({ message: 'Memproses bypass...' });
    await loading.present();

    this.koService.bypassDriverCheckout(this.bypassAttendanceId, this.bypassReason.trim()).subscribe({
      next: async (res) => {
        this.isSubmittingBypass = false;
        await loading.dismiss();
        this.isBypassModalOpen = false;
        await this.showToast(res?.message || 'Bypass absen pulang driver berhasil diterapkan.', 'success');
        this.loadDeliveries();
      },
      error: async (err) => {
        this.isSubmittingBypass = false;
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal memproses bypass.', 'danger');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
      default:
        return 'warning';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      case 'pending':
      default:
        return 'Menunggu';
    }
  }

  doRefresh(event: any) {
    this.loadDeliveries(event);
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2800,
      position: 'bottom',
    });
    await toast.present();
  }
}
