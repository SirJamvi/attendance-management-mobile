import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonSegment, IonSegmentButton, IonLabel, IonBadge, IonRefresher, IonRefresherContent,
  IonSpinner, IonModal, IonTextarea, IonInput, IonItem,
  AlertController, LoadingController, ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, checkmarkCircleOutline, closeCircleOutline, warningOutline,
  shieldCheckmarkOutline, alertCircleOutline, eyeOutline, cashOutline,
  cubeOutline, personOutline, closeOutline, layersOutline, checkmarkDoneOutline,
  documentAttachOutline, imageOutline, callOutline, timeOutline, checkmarkDoneCircleOutline,
  cardOutline, logoWhatsapp, locationOutline, chatbubbleEllipsesOutline, checkmark,
  arrowBackOutline, chevronForwardOutline, sparklesOutline, bicycleOutline, refreshOutline,
  speedometerOutline, constructOutline, checkmarkSharp, storefrontOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchService } from 'src/app/services/branch.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { Branch, KoDeliveryItem, PosCrossCheckDriver } from 'src/app/types/api.types';

export interface DriverDeliveryGroup {
  driver_id: number;
  driver_name: string;
  vehicle_name?: string;
  branch_id?: number | null;
  branch_name?: string | null;
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
  private branchService = inject(BranchService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  // Approval Center Hub: 'hub' | 'deliveries' | 'business_cards' | 'inspections'
  activeHubView: 'hub' | 'deliveries' | 'business_cards' | 'inspections' = 'hub';

  selectedDate = this.getTodayDateString();

  // Multi-Cabang Filter
  branches: Branch[] = [];
  selectedBranchId: number | 'all' = 'all';

  // Ringkasan Angka Pending di Approval Center Hub
  pendingDeliveriesCount = 0;
  pendingCardsCount = 0;
  pendingInspectionsCount = 0;
  totalTodayBalls = 0;
  totalTodayCash = 0;

  isLoadingHub = false;

  // Fokus 1: Pengiriman Bal
  selectedStatus: 'pending' | 'approved' | 'rejected' | '' = 'pending';
  isLoading = true;
  errorMsg = '';
  posCrossCheck: PosCrossCheckDriver[] = [];
  deliveries: KoDeliveryItem[] = [];
  driverGroups: DriverDeliveryGroup[] = [];
  showPosCrossCheck = false; // Accordion POS disembunyikan default jika tidak anomali

  // Fokus 2: Validasi Kartu Nama
  businessCards: any[] = [];
  pendingBusinessCardsCount = 0;
  isLoadingCards = false;
  cardStatusFilter: 'pending' | 'valid' | 'rejected' | '' = 'pending';

  // Fokus 3: Verifikasi Armada Motor
  inspectionVehicles: any[] = [];
  isLoadingInspections = false;
  inspectionStatusFilter: 'pending' | 'verified' | '' = 'pending';

  // Group Detail Modal
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
      documentAttachOutline, imageOutline, callOutline, timeOutline, checkmarkDoneCircleOutline,
      cardOutline, logoWhatsapp, locationOutline, chatbubbleEllipsesOutline, checkmark,
      arrowBackOutline, chevronForwardOutline, sparklesOutline, bicycleOutline, refreshOutline,
      speedometerOutline, constructOutline, checkmarkSharp, storefrontOutline
    });
  }

  ngOnInit() {
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
    if (this.activeHubView === 'hub') {
      this.loadHubSummary();
    } else if (this.activeHubView === 'deliveries') {
      this.loadDeliveries();
    } else if (this.activeHubView === 'business_cards') {
      this.loadBusinessCards();
    } else if (this.activeHubView === 'inspections') {
      this.loadInspections();
    }
  }

  ionViewWillEnter() {
    this.loadHubSummary();
  }

  private getTodayDateString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get totalPendingAll(): number {
    return this.pendingDeliveriesCount + this.pendingCardsCount + this.pendingInspectionsCount;
  }

  get hasPosAnomaly(): boolean {
    return Array.isArray(this.posCrossCheck) && this.posCrossCheck.some(p => p.is_anomaly);
  }

  // =========================================================
  // APPROVAL CENTER HUB: NAVIGASI & STATISTIK
  // =========================================================

  loadHubSummary(event?: any) {
    this.isLoadingHub = !event;

    // 1. Ambil summary pengiriman bal
    this.koService.getDeliveries({ date: this.selectedDate, branch_id: this.selectedBranchId }).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          const list = Array.isArray(res.data.deliveries) ? res.data.deliveries : [];
          this.deliveries = list;
          this.posCrossCheck = Array.isArray(res.data.pos_cross_check) ? res.data.pos_cross_check : [];
          this.driverGroups = this.groupDeliveriesByDriver(list);

          this.pendingDeliveriesCount = list.filter((d: KoDeliveryItem) => d.status === 'pending').length;
          this.totalTodayBalls = list.reduce((sum: number, d: KoDeliveryItem) => sum + (Number(d.total_balls) || 0), 0);
          this.totalTodayCash = list.reduce((sum: number, d: KoDeliveryItem) => sum + (Number(d.cash_collected) || 0), 0);

          // Buka panel POS otomatis HANYA jika terdeteksi anomali selisih
          this.showPosCrossCheck = this.hasPosAnomaly;
        }
        this.isLoadingHub = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoadingHub = false;
        if (event) event.target.complete();
      }
    });

    // 2. Ambil summary kartu nama
    this.koService.getBusinessCards({ date: this.selectedDate, status: 'pending', branch_id: this.selectedBranchId }).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.pendingCardsCount = Number(res.data.pending_count) || 0;
        }
      },
      error: () => {}
    });

    // 3. Ambil summary inspeksi motor yang butuh verifikasi KO
    this.koService.getTodayChecksheets(this.selectedDate, this.selectedBranchId).subscribe({
      next: (res) => {
        if (res?.success && res.data?.phases) {
          const vehicleList: any[] = [];
          const phases = [res.data.phases.pagi, res.data.phases.siang, res.data.phases.sore, res.data.phases.malam || []];
          for (const phaseSlots of phases) {
            if (!Array.isArray(phaseSlots)) continue;
            for (const slot of phaseSlots) {
              if (slot.requires_vehicle && Array.isArray(slot.vehicles)) {
                for (const v of slot.vehicles) {
                  vehicleList.push({
                    ...v,
                    slot_title: slot.title,
                    slot_slug: slot.slug,
                  });
                }
              }
            }
          }
          this.inspectionVehicles = vehicleList;
          this.pendingInspectionsCount = vehicleList.filter(v => v.completed && !v.is_verified).length;
        }
      },
      error: () => {}
    });
  }

  openHubSection(section: 'deliveries' | 'business_cards' | 'inspections') {
    this.activeHubView = section;
    if (section === 'deliveries') {
      this.loadDeliveries();
    } else if (section === 'business_cards') {
      this.loadBusinessCards();
    } else if (section === 'inspections') {
      this.loadInspections();
    }
  }

  backToHub() {
    this.activeHubView = 'hub';
    this.loadHubSummary();
  }

  // =========================================================
  // FOKUS 1: APPROVAL PENGIRIMAN BAL DRIVER
  // =========================================================

  loadDeliveries(event?: any) {
    if (!event && this.deliveries.length === 0) {
      this.isLoading = true;
    }
    this.errorMsg = '';

    this.koService
      .getDeliveries({
        date: this.selectedDate,
        status: this.selectedStatus || undefined,
        branch_id: this.selectedBranchId,
      })
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.posCrossCheck = Array.isArray(res.data.pos_cross_check) ? res.data.pos_cross_check : [];
            this.deliveries = Array.isArray(res.data.deliveries) ? res.data.deliveries : [];
            this.driverGroups = this.groupDeliveriesByDriver(this.deliveries);

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

  private groupDeliveriesByDriver(deliveries: KoDeliveryItem[]): DriverDeliveryGroup[] {
    const map = new Map<number, DriverDeliveryGroup>();

    for (const item of deliveries) {
      const driverId = item.driver_id || (item.driver as any)?.id || 0;
      const driverName = item.driver_name || (item.driver as any)?.name || 'Driver';
      const vehicleName = item.vehicle_name || (item.vehicle as any)?.name || '';
      const branchId = item.branch_id || null;
      const branchName = item.branch_name || null;

      if (!map.has(driverId)) {
        map.set(driverId, {
          driver_id: driverId,
          driver_name: driverName,
          vehicle_name: vehicleName,
          branch_id: branchId,
          branch_name: branchName,
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
      if (a.pending_count > 0 && b.pending_count === 0) return -1;
      if (a.pending_count === 0 && b.pending_count > 0) return 1;
      return a.driver_name.localeCompare(b.driver_name);
    });
  }

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
    if (url.startsWith('http') || url.startsWith('data:')) {
      this.previewPhotoUrl = url;
    } else {
      const cleanPath = url.replace(/^\/?storage\//, '').replace(/^\//, '');
      this.previewPhotoUrl = `https://attendance.eskristalkarawang.com/storage/${cleanPath}`;
    }
    this.isPhotoModalOpen = true;
  }

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

    this.koService.approveDriverBatch(group.driver_id, this.selectedDate, group.branch_id || undefined).subscribe({
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

  // =========================================================
  // FOKUS 2: VALIDASI KARTU NAMA / PROSPEK DRIVER
  // =========================================================

  loadBusinessCards(event?: any) {
    this.isLoadingCards = !event && this.businessCards.length === 0;

    this.koService
      .getBusinessCards({
        date: this.selectedDate,
        status: this.cardStatusFilter || undefined,
        branch_id: this.selectedBranchId,
      })
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.businessCards = Array.isArray(res.data.cards) ? res.data.cards : [];
            this.pendingBusinessCardsCount = Number(res.data.pending_count) || 0;
          }
          this.isLoadingCards = false;
          if (event) event.target.complete();
        },
        error: (err) => {
          this.isLoadingCards = false;
          if (event) event.target.complete();
          console.warn('Gagal memuat kartu nama:', err);
        }
      });
  }

  async promptApproveCard(card: any) {
    const alert = await this.alertCtrl.create({
      header: 'Validasi Kartu Nama?',
      subHeader: `${card.customer_name} (${card.customer_phone})`,
      message: `Setujui bukti penyerahan kartu nama ini dari driver ${card.user?.name || ''}? Data terverifikasi akan dicatat valid untuk KPI driver.`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Setujui (Valid)',
          handler: () => {
            this.executeVerifyCard(card.id, 'valid');
          }
        }
      ]
    });
    await alert.present();
  }

  async promptRejectCard(card: any) {
    const alert = await this.alertCtrl.create({
      header: 'Tolak Bukti Kartu Nama',
      subHeader: `${card.customer_name} (${card.customer_phone})`,
      message: 'Masukkan alasan penolakan (misal: Foto buram, bukan plang/kartu nama toko asli, toko tidak ada):',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Alasan penolakan (wajib)...',
        }
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Tolak',
          cssClass: 'danger',
          handler: (data) => {
            const reason = (data?.reason || '').trim();
            if (!reason) {
              this.showToast('Alasan penolakan wajib diisi!', 'warning');
              return false;
            }
            this.executeVerifyCard(card.id, 'rejected', reason);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async executeVerifyCard(id: number, decision: 'valid' | 'rejected', reason?: string) {
    const loading = await this.loadingCtrl.create({
      message: decision === 'valid' ? 'Memvalidasi kartu nama...' : 'Menolak kartu nama...'
    });
    await loading.present();

    this.koService.verifyBusinessCard(id, decision, reason).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(
          res?.message || (decision === 'valid' ? 'Kartu nama berhasil divalidasi (Valid)!' : 'Kartu nama ditolak.'),
          decision === 'valid' ? 'success' : 'warning'
        );
        this.loadBusinessCards();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal memvalidasi kartu nama.', 'danger');
      }
    });
  }

  openExternalLink(url?: string | null) {
    if (!url) return;
    window.open(url, '_blank');
  }

  // =========================================================
  // FOKUS 3: VERIFIKASI INSPEKSI ARMADA MOTOR (BUILT-IN)
  // =========================================================

  loadInspections(event?: any) {
    this.isLoadingInspections = !event && this.inspectionVehicles.length === 0;

    this.koService.getTodayChecksheets(this.selectedDate, this.selectedBranchId).subscribe({
      next: (res) => {
        if (res?.success && res.data?.phases) {
          const list: any[] = [];
          const phases = [
            res.data.phases.pagi,
            res.data.phases.siang,
            res.data.phases.sore,
            res.data.phases.malam || []
          ];
          for (const phaseSlots of phases) {
            if (!Array.isArray(phaseSlots)) continue;
            for (const slot of phaseSlots) {
              if (slot.requires_vehicle && Array.isArray(slot.vehicles)) {
                for (const v of slot.vehicles) {
                  list.push({
                    ...v,
                    slot_title: slot.title,
                    slot_slug: slot.slug,
                  });
                }
              }
            }
          }
          this.inspectionVehicles = list;
          this.pendingInspectionsCount = list.filter(v => v.completed && !v.is_verified).length;
        }
        this.isLoadingInspections = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoadingInspections = false;
        if (event) event.target.complete();
      }
    });
  }

  get filteredInspectionVehicles(): any[] {
    if (this.inspectionStatusFilter === 'pending') {
      return this.inspectionVehicles.filter(v => v.completed && !v.is_verified);
    }
    if (this.inspectionStatusFilter === 'verified') {
      return this.inspectionVehicles.filter(v => v.completed && v.is_verified);
    }
    return this.inspectionVehicles;
  }

  isFuelBelowHalf(level?: string | null): boolean {
    if (!level) return false;
    const l = level.toLowerCase().trim();
    return l.includes('1/4') || l.includes('habis') || l === '0%' || l === '25%';
  }

  async promptApproveInspection(vehicle: any) {
    if (!vehicle.submission_id) {
      await this.showToast('Data inspeksi belum memiliki ID valid.', 'warning');
      return;
    }

    const fuelLevel = vehicle.answers?.fuel_level?.value_text;
    const isLowFuel = this.isFuelBelowHalf(fuelLevel);
    let confirmMsg = `Setujui hasil inspeksi fisik dari driver ${vehicle.submitted_by || ''}? Armada dinyatakan layak beroperasi.`;
    if (isLowFuel) {
      confirmMsg += `\n\n⚠️ PERHATIAN BENSIN: Indikator bensin tercatat '${fuelLevel}' (kurang dari 1/2).\nReminder KO: Silakan lakukan / instruksikan isi bensin armada!`;
    }

    const alert = await this.alertCtrl.create({
      header: isLowFuel ? '⚠️ Verifikasi (Bensin Kurang)' : 'Verifikasi Armada Aman?',
      subHeader: `${vehicle.vehicle_name || vehicle.name} (${vehicle.plate_number || '-'})`,
      message: confirmMsg,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: isLowFuel ? 'Tetap Setujui' : 'Verifikasi Aman',
          handler: () => {
            this.executeVerifyInspection(vehicle.submission_id, 'approved');
          }
        }
      ]
    });
    await alert.present();
  }

  async promptRejectInspection(vehicle: any) {
    if (!vehicle.submission_id) {
      await this.showToast('Data inspeksi belum memiliki ID valid.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Catatan Perbaikan Armada',
      subHeader: `${vehicle.vehicle_name || vehicle.name} (${vehicle.plate_number || '-'})`,
      message: 'Masukkan catatan kendala armada (misal: Bensin kurang dari batas minimal, lampu mati, rem kurang pakem):',
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Catatan kendala / perbaikan...',
        }
      ],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Simpan Catatan',
          cssClass: 'warning',
          handler: (data) => {
            const notes = (data?.notes || '').trim();
            this.executeVerifyInspection(vehicle.submission_id, 'needs_review', notes);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async executeVerifyInspection(submissionId: number, status: 'approved' | 'needs_review', notes?: string) {
    const loading = await this.loadingCtrl.create({
      message: status === 'approved' ? 'Menyetujui verifikasi armada...' : 'Menyimpan catatan perbaikan...'
    });
    await loading.present();

    this.koService.verifyInspection(submissionId, {
      status,
      review_notes: notes
    }).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(
          res?.message || (status === 'approved' ? 'Armada berhasil diverifikasi aman!' : 'Catatan perbaikan berhasil disimpan.'),
          status === 'approved' ? 'success' : 'warning'
        );
        this.loadInspections();
        this.loadHubSummary();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal memproses verifikasi armada.', 'danger');
      }
    });
  }

  // =========================================================
  // BYPASS CHECK-OUT DRIVER
  // =========================================================

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
      case 'valid':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'flagged_duplicate':
        return 'warning';
      case 'pending':
      default:
        return 'warning';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'valid':
        return 'Valid';
      case 'rejected':
        return 'Ditolak';
      case 'flagged_duplicate':
        return 'Duplikat';
      case 'pending':
      default:
        return 'Menunggu';
    }
  }

  doRefresh(event: any) {
    if (this.activeHubView === 'hub') {
      this.loadHubSummary(event);
    } else if (this.activeHubView === 'deliveries') {
      this.loadDeliveries(event);
    } else if (this.activeHubView === 'business_cards') {
      this.loadBusinessCards(event);
    } else if (this.activeHubView === 'inspections') {
      this.loadInspections(event);
    }
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
