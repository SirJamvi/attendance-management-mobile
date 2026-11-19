import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonInput, IonTextarea, IonSelect,
  IonSelectOption, IonItem, IonIcon, IonBadge, IonProgressBar, IonSpinner,
  IonRefresher, IonRefresherContent,
  LoadingController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline, addCircleOutline, trashOutline, cameraOutline, sendOutline,
  checkmarkCircleOutline, timeOutline, alertCircleOutline, cubeOutline,
  calendarOutline, carOutline, listOutline
} from 'ionicons/icons';
import { CameraDirection } from '@capacitor/camera';

import { DriverOperationsService } from 'src/app/services/driver-operations.service';
import { AttendanceService } from 'src/app/services/attendance';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { captureCompressedPhoto } from 'src/app/utils/image-compressor';
import {
  DriverDeliveryHistoryData,
  DriverDeliveryItemInput,
  DriverDeliveryPayload,
  DriverDeliveryTodayData,
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
    IonSegment, IonSegmentButton, IonLabel, IonInput, IonTextarea, IonSelect,
    IonSelectOption, IonItem, IonIcon, IonBadge, IonProgressBar, IonSpinner,
    IonRefresher, IonRefresherContent
  ]
})
export class DriverBulkDeliveryPage implements OnInit {
  private driverService = inject(DriverOperationsService);
  private attendanceService = inject(AttendanceService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  activeTab: 'magic_paste' | 'manual' | 'progress' = 'magic_paste';

  // Shared metadata
  vehicles: VehicleOption[] = [];
  selectedVehicleId: number | null = null;
  proofPhoto: string | null = null;

  // Tab 1: Magic Paste WA
  rawWaText = '';
  isParsing = false;
  parsedItems: DriverDeliveryItemInput[] = [];

  // Tab 2: Manual Multi-Baris
  manualItems: DriverDeliveryItemInput[] = [this.createEmptyItem()];

  // Tab 3: Progres Hari Ini & Riwayat
  isLoadingProgress = false;
  todayData: DriverDeliveryTodayData | null = null;
  historyMonth = this.getCurrentMonthString();
  historyData: DriverDeliveryHistoryData | null = null;

  isSubmitting = false;

  constructor() {
    addIcons({
      sparklesOutline, addCircleOutline, trashOutline, cameraOutline, sendOutline,
      checkmarkCircleOutline, timeOutline, alertCircleOutline, cubeOutline,
      calendarOutline, carOutline, listOutline
    });
  }

  ngOnInit() {
    this.loadVehicles();
  }

  ionViewWillEnter() {
    this.loadTodayDeliveries();
    this.loadDeliveryHistory();
  }

  private getCurrentMonthString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  createEmptyItem(): DriverDeliveryItemInput {
    return {
      customer_name: '',
      qty_20kg: 0,
      qty_15kg: 0,
      qty_10kg: 0,
      qty_5kg: 0,
      payment_method: 'cash',
      cash_collected: 0,
    };
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
  // TAB 1: MAGIC PASTE WA
  // ==========================================

  async parseWaText() {
    if (!this.rawWaText.trim()) {
      await this.showToast('Tempel teks laporan WA terlebih dahulu.', 'warning');
      return;
    }

    this.isParsing = true;
    const loading = await this.loadingCtrl.create({ message: 'Mem-parse teks WA...' });
    await loading.present();

    this.driverService.parseWaText(this.rawWaText).subscribe({
      next: async (res) => {
        this.isParsing = false;
        await loading.dismiss();

        const rawItems = res?.data?.items || (Array.isArray(res?.data) ? (res.data as any) : []);
        this.parsedItems = rawItems.map((it: any) => ({
          customer_name: it.customer_name || '',
          qty_20kg: Number(it.qty_20kg || 0),
          qty_15kg: Number(it.qty_15kg || 0),
          qty_10kg: Number(it.qty_10kg || 0),
          qty_5kg: Number(it.qty_5kg || 0),
          payment_method: (it.payment_method || 'cash').toLowerCase(),
          cash_collected: Number(it.cash_collected || 0),
        }));

        if (this.parsedItems.length === 0) {
          await this.showToast('Tidak ada baris pengiriman terdeteksi. Anda bisa tambah manual.', 'warning');
        } else {
          await this.showToast(`Berhasil mem-parse ${this.parsedItems.length} baris pengiriman!`, 'success');
        }
      },
      error: async (err) => {
        this.isParsing = false;
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal mem-parse teks WA.', 'danger');
      }
    });
  }

  addParsedRow() {
    this.parsedItems.push(this.createEmptyItem());
  }

  removeParsedRow(index: number) {
    this.parsedItems.splice(index, 1);
  }

  // ==========================================
  // TAB 2: INPUT MANUAL MULTI-BARIS
  // ==========================================

  addManualRow() {
    this.manualItems.push(this.createEmptyItem());
  }

  removeManualRow(index: number) {
    if (this.manualItems.length > 1) {
      this.manualItems.splice(index, 1);
    } else {
      this.manualItems[0] = this.createEmptyItem();
    }
  }

  // ==========================================
  // HELPERS: RINGKASAN & FOTO BUKTI
  // ==========================================

  getItemBalls(item: DriverDeliveryItemInput): number {
    return (
      (Number(item.qty_20kg) || 0) +
      (Number(item.qty_15kg) || 0) +
      (Number(item.qty_10kg) || 0) +
      (Number(item.qty_5kg) || 0)
    );
  }

  getItemWeightKg(item: DriverDeliveryItemInput): number {
    return (
      (Number(item.qty_20kg) || 0) * 20 +
      (Number(item.qty_15kg) || 0) * 15 +
      (Number(item.qty_10kg) || 0) * 10 +
      (Number(item.qty_5kg) || 0) * 5
    );
  }

  getSummary(items: DriverDeliveryItemInput[]) {
    let totalBalls = 0;
    let totalWeight = 0;
    let totalCash = 0;

    for (const item of items) {
      totalBalls += this.getItemBalls(item);
      totalWeight += this.getItemWeightKg(item);
      totalCash += Number(item.cash_collected) || 0;
    }

    return { count: items.length, totalBalls, totalWeight, totalCash };
  }

  async takeProofPhoto() {
    try {
      const compressed = await captureCompressedPhoto({
        direction: CameraDirection.Rear,
        maxWidth: 1280,
        quality: 0.75,
        promptHeader: 'Foto Bukti Pengiriman',
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

  // ==========================================
  // SUBMIT BULK DELIVERY
  // ==========================================

  async submitDeliveries(mode: 'magic_paste' | 'manual') {
    const sourceItems = mode === 'magic_paste' ? this.parsedItems : this.manualItems;
    if (sourceItems.length === 0) {
      await this.showToast('Tambahkan minimal 1 baris pengiriman.', 'warning');
      return;
    }

    const sanitizedItems: DriverDeliveryItemInput[] = [];
    for (let i = 0; i < sourceItems.length; i++) {
      const it = sourceItems[i];
      if (!it.customer_name || !it.customer_name.trim()) {
        await this.showToast(`Baris #${i + 1}: Nama customer wajib diisi.`, 'warning');
        return;
      }
      if (this.getItemBalls(it) <= 0) {
        await this.showToast(`Baris #${i + 1} (${it.customer_name}): Jumlah bal minimal 1.`, 'warning');
        return;
      }
      sanitizedItems.push({
        customer_name: it.customer_name.trim(),
        qty_20kg: Number(it.qty_20kg) || 0,
        qty_15kg: Number(it.qty_15kg) || 0,
        qty_10kg: Number(it.qty_10kg) || 0,
        qty_5kg: Number(it.qty_5kg) || 0,
        payment_method: it.payment_method || 'cash',
        cash_collected: Number(it.cash_collected) || 0,
      });
    }

    const payload: DriverDeliveryPayload = {
      input_mode: mode,
      items: sanitizedItems,
    };

    if (this.selectedVehicleId) {
      payload.vehicle_id = this.selectedVehicleId;
    }
    if (mode === 'magic_paste' && this.rawWaText.trim()) {
      payload.raw_wa_text = this.rawWaText.trim();
    }
    if (this.proofPhoto) {
      payload.proof_photo = this.proofPhoto;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim laporan delivery...' });
    await loading.present();

    this.driverService.submitBulkDelivery(payload).subscribe({
      next: async (res) => {
        this.isSubmitting = false;
        await loading.dismiss();

        // Update Driver checkout eligibility immediately so Absen Pulang unlocks!
        const eligibility = res?.data?.checkout_eligibility || res?.meta?.checkout_eligibility;
        if (eligibility) {
          this.attendanceService.updateCheckoutEligibility(eligibility);
        }

        await this.showToast(res?.message || 'Laporan delivery berhasil dikirim!', 'success');

        // Reset form & switch to Progress tab
        if (mode === 'magic_paste') {
          this.rawWaText = '';
          this.parsedItems = [];
        } else {
          this.manualItems = [this.createEmptyItem()];
        }
        this.proofPhoto = null;
        this.activeTab = 'progress';
        this.loadTodayDeliveries();
        this.loadDeliveryHistory();
      },
      error: async (err) => {
        this.isSubmitting = false;
        await loading.dismiss();
        await this.showToast(
          err.error?.message || 'Gagal mengirim laporan delivery.',
          'danger'
        );
      }
    });
  }

  // ==========================================
  // TAB 3: PROGRES HARI INI & RIWAYAT
  // ==========================================

  loadTodayDeliveries(event?: any) {
    this.isLoadingProgress = !event && !this.todayData;
    this.driverService.getTodayDeliveries().subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.todayData = res.data;
        }
        this.isLoadingProgress = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoadingProgress = false;
        if (event) event.target.complete();
      }
    });
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

  doRefresh(event: any) {
    this.loadTodayDeliveries(event);
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
