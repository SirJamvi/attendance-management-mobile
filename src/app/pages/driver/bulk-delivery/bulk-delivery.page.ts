import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonSelect, IonSelectOption,
  IonItem, IonIcon, IonBadge, IonProgressBar, IonSpinner,
  IonRefresher, IonRefresherContent,
  IonInput, IonTextarea,
  LoadingController, ToastController, ActionSheetController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  sparklesOutline, addCircleOutline, trashOutline, cameraOutline, sendOutline,
  checkmarkCircleOutline, checkmarkDoneCircleOutline, timeOutline, alertCircleOutline,
  cubeOutline, calendarOutline, carOutline, listOutline, refreshOutline, storefrontOutline,
  cashOutline, cardOutline, receiptOutline, imageOutline, chevronDownOutline, chevronUpOutline,
  sparkles, searchOutline, closeOutline, chevronForwardOutline, checkmark,
  person, personOutline, close
} from 'ionicons/icons';
import { CameraDirection, CameraSource } from '@capacitor/camera';

import { DriverOperationsService } from 'src/app/services/driver-operations.service';
import { AttendanceService } from 'src/app/services/attendance';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { captureCompressedPhoto, captureDetailedPhoto } from 'src/app/utils/image-compressor';
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
    IonRefresher, IonRefresherContent,
    IonInput, IonTextarea
  ]
})
export class DriverBulkDeliveryPage implements OnInit {
  private driverService = inject(DriverOperationsService);
  private attendanceService = inject(AttendanceService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);

  activeTab: 'pos_orders' | 'manual' | 'history' = 'pos_orders';

  // Shared metadata
  vehicles: VehicleOption[] = [];
  selectedVehicleId: number | null = null;
  proofPhoto: string | null = null;

  // Tab 1: Pesanan POS Hari Ini
  isLoadingPos = false;
  posData: DriverPosOrdersResponse | null = null;
  isSubmitting = false;
  showOrdersList = true; // Driver bisa toggle list agar tidak menumpuk layar

  // Tab 2: Input Pengiriman Manual Terintegrasi POS Buku-Digital
  manualForm = {
    customer_id: null as number | null,
    customer_name: '',
    qty_20kg: 0,
    qty_15kg: 0,
    qty_10kg: 0,
    qty_5kg: 0,
    payment_method: 'cash' as string,
    cash_collected: 0,
    proof_photo: null as string | null,
    vehicle_id: null as number | null,
    notes: ''
  };
  isSubmittingManual = false;

  // Rekomendasi POS Belum Ada Driver & Pencarian Pelanggan Buku Digital
  unassignedOrders: any[] = [];
  isLoadingUnassigned = false;
  customers: any[] = [];
  isLoadingCustomers = false;
  isCustomerDropdownOpen = false;

  // Tab 3: Riwayat Pengiriman
  historyMonth = this.getCurrentMonthString();
  historyData: DriverDeliveryHistoryData | null = null;

  constructor() {
    addIcons({
      sparklesOutline, addCircleOutline, trashOutline, cameraOutline, sendOutline,
      checkmarkCircleOutline, checkmarkDoneCircleOutline, timeOutline, alertCircleOutline,
      cubeOutline, calendarOutline, carOutline, listOutline, refreshOutline, storefrontOutline,
      cashOutline, cardOutline, receiptOutline, imageOutline, chevronDownOutline, chevronUpOutline,
      sparkles, searchOutline, closeOutline, chevronForwardOutline, checkmark,
      person, personOutline, close
    });
  }

  ngOnInit() {
    this.loadVehicles();
    this.loadCustomers();
  }

  ionViewWillEnter() {
    this.loadPosOrders();
    this.loadDeliveryHistory();
    this.loadCustomers();
  }

  onTabChanged(tab: any) {
    if (!tab) return;
    this.activeTab = tab;
    if (tab === 'manual') {
      if (this.customers.length === 0) {
        this.loadCustomers();
      }
    }
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

  loadUnassignedOrders() {
    this.isLoadingUnassigned = true;
    this.driverService.getUnassignedPosOrders().subscribe({
      next: (res) => {
        this.isLoadingUnassigned = false;
        this.unassignedOrders = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err) => {
        this.isLoadingUnassigned = false;
        console.warn('Gagal memuat pesanan POS tanpa driver:', err?.status, err?.error?.message || err?.message || err);
      }
    });
  }

  loadCustomers() {
    this.isLoadingCustomers = true;
    this.driverService.getCustomers().subscribe({
      next: (res) => {
        this.isLoadingCustomers = false;
        const list = Array.isArray(res?.data) ? res.data : [];
        // Pastikan Pelanggan Umum ada di paling atas jika belum ada
        if (!list.some(c => this.isGeneralCustomer(c.name))) {
          list.unshift({
            id: 1,
            name: 'Pelanggan Umum',
            address: 'Pelanggan Walk-in / Langsung',
            phone: ''
          });
        }
        this.customers = list;
      },
      error: (err) => {
        this.isLoadingCustomers = false;
        console.warn('Gagal memuat daftar pelanggan:', err?.status, err?.error?.message || err?.message || err);
        // Fallback default jika koneksi gagal agar driver tetap bisa memilih Pelanggan Umum
        if (this.customers.length === 0) {
          this.customers = [
            { id: 1, name: 'Pelanggan Umum', address: 'Pelanggan Walk-in / Langsung', phone: '' }
          ];
        }
      }
    });
  }

  isGeneralCustomer(name?: string): boolean {
    if (!name) return false;
    return name.toLowerCase().includes('pelanggan umum');
  }

  get filteredCustomers(): any[] {
    const q = (this.manualForm.customer_name || '').trim().toLowerCase();
    if (!q) return this.customers.slice(0, 100);
    return this.customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    ).slice(0, 100);
  }

  openCustomerDropdown() {
    if (this.customers.length === 0) {
      this.loadCustomers();
    }
    this.isCustomerDropdownOpen = true;
  }

  closeCustomerDropdown() {
    this.isCustomerDropdownOpen = false;
  }

  onCustomerInput() {
    this.manualForm.customer_id = null;
    this.isCustomerDropdownOpen = true;
  }

  selectCustomer(cust: any) {
    this.manualForm.customer_id = cust.id;
    this.manualForm.customer_name = cust.name;
    this.isCustomerDropdownOpen = false;
  }

  clearCustomer() {
    this.manualForm.customer_id = null;
    this.manualForm.customer_name = '';
    this.isCustomerDropdownOpen = true;
  }

  selectUnassignedOrder(order: any) {
    this.manualForm.customer_id = order.customer_id || null;
    this.manualForm.customer_name = order.customer_name || '';
    this.manualForm.qty_20kg = order.qty_20kg || 0;
    this.manualForm.qty_15kg = order.qty_15kg || 0;
    this.manualForm.qty_10kg = order.qty_10kg || 0;
    this.manualForm.qty_5kg = order.qty_5kg || 0;
    this.manualForm.payment_method = order.payment_method || 'cash';
    this.manualForm.cash_collected = (order.payment_method === 'cash') ? (order.total_amount || 0) : 0;
    this.manualForm.notes = `Klaim Nota POS ${order.invoice_number}`;
    this.showToast(`Nota ${order.invoice_number} terpilih! Silakan periksa dan kirim untuk verifikasi otomatis.`, 'primary');
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

  // ==========================================
  // TAB 2: INPUT PENGIRIMAN MANUAL
  // ==========================================

  get manualTotalBalls(): number {
    return (Number(this.manualForm.qty_20kg) || 0) +
           (Number(this.manualForm.qty_15kg) || 0) +
           (Number(this.manualForm.qty_10kg) || 0) +
           (Number(this.manualForm.qty_5kg) || 0);
  }

  get manualTotalWeightKg(): number {
    return ((Number(this.manualForm.qty_20kg) || 0) * 20) +
           ((Number(this.manualForm.qty_15kg) || 0) * 15) +
           ((Number(this.manualForm.qty_10kg) || 0) * 10) +
           ((Number(this.manualForm.qty_5kg) || 0) * 5);
  }

  async takeManualProofPhoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Foto Bukti Serah Terima / Nota Manual',
      buttons: [
        {
          text: 'Ambil Foto Kamera',
          icon: 'camera-outline',
          handler: () => {
            this.processManualPhoto(CameraSource.Camera);
          }
        },
        {
          text: 'Pilih dari Galeri Foto',
          icon: 'image-outline',
          handler: () => {
            this.processManualPhoto(CameraSource.Photos);
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

  async processManualPhoto(source: CameraSource) {
    try {
      const detailed = await captureDetailedPhoto({
        source,
        direction: CameraDirection.Rear,
        maxWidth: 1280,
        quality: 0.70,
        promptHeader: 'Foto Bukti Pengiriman'
      });

      if (!detailed) return;

      if (source === CameraSource.Photos) {
        if (detailed.hasExifDate && detailed.isOlderThan7Days) {
          const alert = await this.alertCtrl.create({
            header: 'Foto Melebihi 7 Hari',
            subHeader: `Foto diambil ${detailed.daysAgo} hari yang lalu`,
            message: 'Sistem menolak foto yang diambil lebih dari 1 minggu yang lalu. Harap gunakan foto terbaru.',
            buttons: ['Mengerti']
          });
          await alert.present();
          return;
        }

        if (!detailed.hasExifDate) {
          await this.showToast('Foto tidak memiliki tanggal asli (misal: unduhan WA). Tanggal dicatat hari ini.', 'warning');
        }
      }

      this.manualForm.proof_photo = detailed.dataUrl;
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('cancel')) return;
      await this.showToast('Gagal memuat foto bukti.', 'danger');
    }
  }

  clearManualProofPhoto() {
    this.manualForm.proof_photo = null;
  }

  resetManualForm() {
    this.manualForm = {
      customer_id: null,
      customer_name: '',
      qty_20kg: 0,
      qty_15kg: 0,
      qty_10kg: 0,
      qty_5kg: 0,
      payment_method: 'cash',
      cash_collected: 0,
      proof_photo: null,
      vehicle_id: null,
      notes: ''
    };
  }

  async submitManualDelivery() {
    if (!this.manualForm.customer_name.trim()) {
      await this.showToast('Pilih pelanggan toko terlebih dahulu.', 'warning');
      return;
    }
    if (this.manualTotalBalls <= 0) {
      await this.showToast('Minimal harus mengisi 1 bal pada salah satu varian es (20k, 15k, 10k, atau 5k).', 'warning');
      return;
    }
    if (!this.manualForm.payment_method) {
      await this.showToast('Pilih metode pembayaran sesuai nota kasir POS.', 'warning');
      return;
    }

    this.isSubmittingManual = true;
    const loading = await this.loadingCtrl.create({
      message: 'Mencocokkan dengan POS kasir & verifikasi...',
    });
    await loading.present();

    const payload: any = {
      input_mode: 'manual' as const,
      vehicle_id: this.manualForm.vehicle_id || this.selectedVehicleId,
      proof_photo: this.manualForm.proof_photo,
      raw_wa_text: this.manualForm.notes || undefined,
      items: [
        {
          customer_id: this.manualForm.customer_id || undefined,
          customer_name: this.manualForm.customer_name.trim(),
          qty_20kg: Number(this.manualForm.qty_20kg) || 0,
          qty_15kg: Number(this.manualForm.qty_15kg) || 0,
          qty_10kg: Number(this.manualForm.qty_10kg) || 0,
          qty_5kg: Number(this.manualForm.qty_5kg) || 0,
          payment_method: this.manualForm.payment_method,
          cash_collected: this.manualForm.payment_method === 'cash' ? (Number(this.manualForm.cash_collected) || 0) : 0,
        }
      ]
    };

    this.driverService.submitBulkDelivery(payload).subscribe({
      next: async (res) => {
        this.isSubmittingManual = false;
        await loading.dismiss();

        const eligibility = res?.data?.checkout_eligibility || res?.meta?.checkout_eligibility;
        if (eligibility) {
          this.attendanceService.updateCheckoutEligibility(eligibility);
        }

        const alert = await this.alertCtrl.create({
          header: 'Pengiriman Berhasil & Terverifikasi! 🎉',
          message: res?.message || 'Data cocok 100% dengan transaksi POS Buku-Digital dan langsung disetujui (Approved).',
          buttons: ['OK']
        });
        await alert.present();

        this.resetManualForm();
        this.loadPosOrders();
        this.loadUnassignedOrders();
        this.loadDeliveryHistory();
        this.activeTab = 'pos_orders';
      },
      error: async (err) => {
        this.isSubmittingManual = false;
        await loading.dismiss();
        const msg = err.error?.message || err.message || 'Gagal memverifikasi pengiriman dengan POS Buku-Digital.';
        const alert = await this.alertCtrl.create({
          header: 'Nota Tidak Cocok / Ditolak',
          message: msg,
          buttons: ['Tutup']
        });
        await alert.present();
      }
    });
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

  async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2800,
      position: 'bottom',
    });
    await toast.present();
  }
}
