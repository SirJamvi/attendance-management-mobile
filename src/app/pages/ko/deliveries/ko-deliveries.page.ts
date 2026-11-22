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
  cubeOutline, personOutline, closeOutline, layersOutline, checkmarkDoneOutline,
  documentAttachOutline, imageOutline, callOutline, timeOutline, checkmarkDoneCircleOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { KoDeliveryItem, PosCrossCheckDriver } from 'src/app/types/api.types';

export interface DriverDeliveryGroup {
  driver_id: number;
  driver_name: string;
  vehicle_name?: string;
  total_orders: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_balls: number;
  qty_20kg: number;
  qty_15kg: number;
  qty_10kg: number;
  qty_5kg: number;
  total_weight_kg: number;
  total_cash: number;
  has_manual_input: boolean;
  deliveries: KoDeliveryItem[];
}

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
  driverGroups: DriverDeliveryGroup[] = [];

  // Group Detail Modal (Melihat seluruh toko milik 1 driver dalam 1 hari)
  isGroupModalOpen = false;
  selectedGroup: DriverDeliveryGroup | null = null;

  // Foto Preview Modal
  previewPhotoUrl: string | null = null;
  isPhotoModalOpen = false;

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
      cubeOutline, personOutline, closeOutline, layersOutline, checkmarkDoneOutline,
      documentAttachOutline, imageOutline, callOutline, timeOutline, checkmarkDoneCircleOutline
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
            this.driverGroups = this.groupDeliveriesByDriver(this.deliveries);

            // Jika modal sedang terbuka, perbarui data group yang sedang dipilih
            if (this.selectedGroup) {
              const updated = this.driverGroups.find((g) => g.driver_id === this.selectedGroup!.driver_id);
              this.selectedGroup = updated || null;
              if (!this.selectedGroup) {
                this.isGroupModalOpen = false;
              }
            }
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

  /**
   * Mengelompokkan seluruh pengiriman per driver agar visual clean (Single Container per Driver)
   */
  private groupDeliveriesByDriver(deliveries: KoDeliveryItem[]): DriverDeliveryGroup[] {
    const map = new Map<number, DriverDeliveryGroup>();

    for (const item of deliveries) {
      const driverId = item.driver_id || (item.driver as any)?.id || 0;
      const driverName = item.driver_name || (item.driver as any)?.name || 'Driver';
      const vehicleName = item.vehicle_name || (item.vehicle as any)?.name || '';

      if (!map.has(driverId)) {
        map.set(driverId, {
          driver_id: driverId,
          driver_name: driverName,
          vehicle_name: vehicleName,
          total_orders: 0,
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          total_balls: 0,
          qty_20kg: 0,
          qty_15kg: 0,
          qty_10kg: 0,
          qty_5kg: 0,
          total_weight_kg: 0,
          total_cash: 0,
          has_manual_input: false,
          deliveries: [],
        });
      }

      const grp = map.get(driverId)!;
      grp.total_orders += 1;
      if (item.status === 'pending') grp.pending_count += 1;
      else if (item.status === 'approved') grp.approved_count += 1;
      else if (item.status === 'rejected') grp.rejected_count += 1;

      grp.total_balls += (Number(item.total_balls) || 0);
      grp.qty_20kg += (Number(item.qty_20kg) || 0);
      grp.qty_15kg += (Number(item.qty_15kg) || 0);
      grp.qty_10kg += (Number(item.qty_10kg) || 0);
      grp.qty_5kg += (Number(item.qty_5kg) || 0);
      grp.total_weight_kg += (Number(item.total_weight_kg) || 0);
      grp.total_cash += (Number(item.cash_collected) || 0);

      if (item.input_mode === 'manual' || (item as any).is_manual) {
        grp.has_manual_input = true;
      }

      grp.deliveries.push(item);
    }

    return Array.from(map.values()).sort((a, b) => {
      // Prioritaskan yang memiliki pending order
      if (a.pending_count > 0 && b.pending_count === 0) return -1;
      if (a.pending_count === 0 && b.pending_count > 0) return 1;
      return a.driver_name.localeCompare(b.driver_name);
    });
  }

  // ==========================================
  // MODAL DETAIL TOKO PER DRIVER
  // ==========================================
  openGroupDetail(group: DriverDeliveryGroup) {
    this.selectedGroup = group;
    this.isGroupModalOpen = true;
  }

  closeGroupDetail() {
    this.isGroupModalOpen = false;
    this.selectedGroup = null;
  }

  viewPhoto(url: string | null | undefined) {
    if (!url) return;
    this.previewPhotoUrl = url;
    this.isPhotoModalOpen = true;
  }

  // ==========================================
  // ONE-CLICK BATCH APPROVAL PER DRIVER
  // ==========================================
  async approveAllForDriver(group: DriverDeliveryGroup, event?: Event) {
    if (event) event.stopPropagation();

    if (group.pending_count === 0) {
      await this.showToast('Semua pesanan driver ini sudah disetujui.', 'warning');
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: 'Approve Semua Pengiriman?',
      subHeader: `${group.driver_name} (${group.pending_count} Pesanan Pending)`,
      message: `Setujui seluruh ${group.pending_count} toko (${group.total_balls} bal / ${group.total_weight_kg} kg) sekaligus?`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Approve Semua',
          handler: () => {
            this.executeApproveDriverBatch(group);
          }
        }
      ]
    });
    await confirm.present();
  }

  private async executeApproveDriverBatch(group: DriverDeliveryGroup) {
    const loading = await this.loadingCtrl.create({
      message: `Menyetujui ${group.pending_count} order...`
    });
    await loading.present();

    this.koService.approveDriverBatch(group.driver_id, this.selectedDate).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(res?.message || 'Seluruh delivery driver berhasil disetujui!', 'success');
        this.loadDeliveries();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal menyetujui batch delivery.', 'danger');
      }
    });
  }

  // ==========================================
  // SINGLE APPROVE & REJECT (INDIVIDUAL STOP)
  // ==========================================
  async approveSingle(item: KoDeliveryItem, event?: Event) {
    if (event) event.stopPropagation();

    const confirm = await this.alertCtrl.create({
      header: 'Setujui Pengiriman?',
      message: `Approve pengiriman ${item.customer_name} (${item.total_balls} bal)?`,
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

  async rejectSingle(item: KoDeliveryItem, event?: Event) {
    if (event) event.stopPropagation();

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
