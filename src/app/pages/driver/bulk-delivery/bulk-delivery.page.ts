import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonSelect, IonSelectOption,
  IonItem, IonIcon, IonBadge, IonProgressBar, IonSpinner,
  IonRefresher, IonRefresherContent,
  LoadingController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline, addCircleOutline, trashOutline, cameraOutline, sendOutline,
  checkmarkCircleOutline, checkmarkDoneCircleOutline, timeOutline, alertCircleOutline,
  cubeOutline, calendarOutline, carOutline, listOutline, refreshOutline, storefrontOutline,
  cashOutline, cardOutline, receiptOutline
} from 'ionicons/icons';
import { CameraDirection } from '@capacitor/camera';

import { DriverOperationsService } from 'src/app/services/driver-operations.service';
import { AttendanceService } from 'src/app/services/attendance';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { captureCompressedPhoto } from 'src/app/utils/image-compressor';
import {
  DriverDeliveryHistoryData,
  DriverPosOrdersResponse,
  KoDeliveryItem,
  PosOrderDeliveryItem,
  VehicleOption
} from 'src/app/types/api.types';

@Component({
  selector: 'app-driver-bulk-delivery',
  templateUrl: './bulk-delivery.page.html',
  styleUrls: ['./bulk-delivery.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonSegment, IonSegmentButton, IonLabel, IonSelect, IonSelectOption,
    IonItem, IonIcon, IonBadge, IonProgressBar, IonSpinner,
    IonRefresher, IonRefresherContent
  ]
})
export class DriverBulkDeliveryPage implements OnInit {
  private driverService = inject(DriverOperationsService);
  private attendanceService = inject(AttendanceService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  activeTab: 'pos_orders' | 'history' = 'pos_orders';

  // Shared metadata
  vehicles: VehicleOption[] = [];
  selectedVehicleId: number | null = null;
  proofPhoto: string | null = null;

  // Tab 1: Pesanan POS Hari Ini
  isLoadingPos = false;
  posData: DriverPosOrdersResponse | null = null;
  isSubmitting = false;

  // Tab 2: Riwayat Pengiriman
  historyMonth = this.getCurrentMonthString();
  historyData: DriverDeliveryHistoryData | null = null;

  constructor() {
    addIcons({
      sparklesOutline, addCircleOutline, trashOutline, cameraOutline, sendOutline,
      checkmarkCircleOutline, checkmarkDoneCircleOutline, timeOutline, alertCircleOutline,
      cubeOutline, calendarOutline, carOutline, listOutline, refreshOutline, storefrontOutline,
      cashOutline, cardOutline, receiptOutline
    });
  }

  ngOnInit() {
    this.loadVehicles();
  }

  ionViewWillEnter() {
    this.loadPosOrders();
    this.loadDeliveryHistory();
  }

  private getCurrentMonthString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  loadVehicles() {
    this.driverService.getVehicles().subscribe({
      next: (res) => {
        this.vehicles = Array.isArray(res?.data) ? res.data : [];
      },
      error: () => {}
    });
  }

  // ==========================================
  // TAB 1: AMBIL PESANAN POS BUKU-DIGITAL
  // ==========================================

  loadPosOrders(event?: any) {
    this.isLoadingPos = !event && !this.posData;
    this.driverService.getPosOrders().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.posData = res.data;
        }
        this.isLoadingPos = false;
        if (event) event.target.complete();
      },
      error: async (err) => {
        this.isLoadingPos = false;
        if (event) event.target.complete();
        console.error('Error loading POS orders:', err);
      }
    });
  }

  async takeProofPhoto() {
    try {
      const compressed = await captureCompressedPhoto({
        direction: CameraDirection.Rear,
        maxWidth: 1280,
        quality: 0.75,
        promptHeader: 'Foto Bukti Setoran Kasir / Rekap',
      });
      if (compressed) {
        this.proofPhoto = compressed;
      }
    } catch (err: any) {
      if (
        err?.message?.toLowerCase().includes('cancel') ||
        err?.message?.toLowerCase().includes('user denied')
      ) {
        return;
      }
      await this.showToast(err?.message || 'Gagal membuka kamera.', 'danger');
    }
  }

  clearProofPhoto() {
    this.proofPhoto = null;
  }

  async confirmDeliveries() {
    if (!this.posData || !this.posData.orders || this.posData.orders.length === 0) {
      await this.showToast('Tidak ada pesanan POS untuk dikonfirmasi.', 'warning');
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({
      message: 'Mengonfirmasi pesanan POS...',
    });
    await loading.present();

    this.driverService.confirmPosDeliveries({
      vehicle_id: this.selectedVehicleId,
      proof_photo: this.proofPhoto,
    }).subscribe({
      next: async (res) => {
        this.isSubmitting = false;
        await loading.dismiss();

        // Update Driver checkout eligibility immediately so Absen Pulang unlocks
        const eligibility = res?.data?.checkout_eligibility || res?.meta?.checkout_eligibility;
        if (eligibility) {
          this.attendanceService.updateCheckoutEligibility(eligibility);
        }

        await this.showToast(res?.message || 'Pengiriman POS berhasil dikonfirmasi!', 'success');

        this.proofPhoto = null;
        this.loadPosOrders();
        this.loadDeliveryHistory();
      },
      error: async (err) => {
        this.isSubmitting = false;
        await loading.dismiss();
        await this.showToast(
          err.error?.message || 'Gagal mengonfirmasi pengiriman POS.',
          'danger'
        );
      }
    });
  }

  // ==========================================
  // TAB 2: RIWAYAT PENGIRIMAN
  // ==========================================

  get historyDeliveries(): KoDeliveryItem[] {
    if (!this.historyData?.deliveries) return [];
    if (Array.isArray(this.historyData.deliveries)) return this.historyData.deliveries;
    return (this.historyData.deliveries as any)?.data || [];
  }

  loadDeliveryHistory() {
    this.driverService.getDeliveryHistory({ month: this.historyMonth }).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.historyData = res.data;
        }
      },
      error: () => {}
    });
  }

  getStatusColor(status: string): string {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  }

  getStatusLabel(status: string): string {
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
  }

  getPaymentBadgeColor(method: string): string {
    const m = (method || '').toLowerCase();
    if (m === 'cash') return 'success';
    if (m === 'transfer') return 'primary';
    if (m === 'qris') return 'tertiary';
    if (m === 'kasbon' || m === 'tempo') return 'warning';
    return 'medium';
  }

  doRefresh(event: any) {
    this.loadPosOrders(event);
    this.loadDeliveryHistory();
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
