import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  IonModal, IonCheckbox, IonInput, IonTextarea, IonFooter,
  IonSegment, IonSegmentButton, IonLabel,
  ToastController, LoadingController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline, bicycleOutline, checkmarkCircleOutline, timeOutline,
  lockClosedOutline, alertCircleOutline, addCircleOutline, cameraOutline,
  trashOutline, closeOutline, sendOutline, shieldCheckmarkOutline, imageOutline,
  checkmark, chevronForward, checkmarkCircle, storefrontOutline, close,
  checkmarkDoneCircleOutline, chevronDownOutline, chevronUpOutline, chevronForwardOutline
} from 'ionicons/icons';

import { DriverOperationsService } from 'src/app/services/driver-operations.service';
import { AttendanceService } from 'src/app/services/attendance';
import { AuthService } from 'src/app/services/auth';
import { BranchService } from 'src/app/services/branch.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { VehicleSelectModalComponent } from 'src/app/components/vehicle-select-modal/vehicle-select-modal.component';
import { BranchSelectModalComponent } from 'src/app/components/branch-select-modal/branch-select-modal.component';
import { Branch, ChecksheetSlot, ChecksheetVehicleStatus, VehicleOption } from 'src/app/types/api.types';
import { captureCompressedPhoto } from 'src/app/utils/image-compressor';
import { CameraDirection } from '@capacitor/camera';

@Component({
  selector: 'app-driver-inspection',
  templateUrl: './driver-inspection.page.html',
  styleUrls: ['./driver-inspection.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    VehicleSelectModalComponent,
    BranchSelectModalComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
    IonModal, IonCheckbox, IonInput, IonTextarea, IonFooter,
    IonSegment, IonSegmentButton, IonLabel
  ]
})
export class DriverInspectionPage implements OnInit, OnDestroy {
  private driverService = inject(DriverOperationsService);
  private attendanceService = inject(AttendanceService);
  public authService = inject(AuthService);
  private branchService = inject(BranchService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);

  private branchSub?: Subscription;

  isLoading = true;
  errorMsg = '';

  slots: ChecksheetSlot[] = [];
  vehicles: VehicleOption[] = [];
  branches: Branch[] = [];

  // ==========================================
  // STATE SLOT AKTIF & TAMPILAN FOKUS
  // ==========================================
  activeSlotId: number | string | null = null;
  showOtherVehicles = false;

  // ==========================================
  // STATE MODAL PILIH CABANG & MODAL MOTOR (AJAX)
  // ==========================================
  isBranchModalOpen = false;
  isVehicleModalOpen = false;
  selectedSlot: ChecksheetSlot | null = null;

  // ==========================================
  // STATE MODAL INSPEKSI ARMADA SIMPEL
  // ==========================================
  isModalOpen = false;
  isSubmitting = false;

  selectedScheduleId: number | null = null;
  selectedSlotTitle = 'Inspeksi Bensin & Armada';
  selectedVehicleId: number | null = null;

  fuelSliderIndex = 4; // Default ke Penuh (index 4)
  fuelLevel = 'Penuh';
  fuelOptions = [
    { value: 'Hampir Habis', label: 'Habis', percent: 0 },
    { value: '1/4', label: '1/4', percent: 25 },
    { value: '1/2', label: '1/2', percent: 50 },
    { value: '3/4', label: '3/4', percent: 75 },
    { value: 'Penuh', label: 'Penuh', percent: 100 }
  ];

  tarpAvailable = true; // Checkbox 1: Terpal
  raincoatAvailable = true; // Checkbox 2: Jas Hujan

  vehicleCondition = 'Layak Jalan';
  conditionOptions = [
    { label: 'Layak jalan', value: 'Layak Jalan', tone: 'ok' },
    { label: 'Servis ringan', value: 'Perlu Servis Ringan', tone: 'warn' },
    { label: 'Rusak', value: 'Mogok / Rusak', tone: 'bad' },
  ];

  odometer: number | null = null;
  notes = '';
  showNotes = false;
  evidencePhoto: string | null = null;

  constructor() {
    addIcons({
      speedometerOutline, bicycleOutline, checkmarkCircleOutline, timeOutline,
      lockClosedOutline, alertCircleOutline, addCircleOutline, cameraOutline,
      trashOutline, closeOutline, sendOutline, shieldCheckmarkOutline, imageOutline,
      checkmark, chevronForward, checkmarkCircle, storefrontOutline, close,
      checkmarkDoneCircleOutline, chevronDownOutline, chevronUpOutline, chevronForwardOutline
    });
  }

  // ==========================================
  // GETTERS & HANDLERS SLIDER VOLUME BENSIN
  // ==========================================
  get fuelFillPercent(): number {
    return (this.fuelSliderIndex / (this.fuelOptions.length - 1)) * 100;
  }

  get isFuelBelowHalf(): boolean {
    return this.fuelSliderIndex < 2; // Index 0: 'Hampir Habis' (0%), Index 1: '1/4' (25%)
  }

  setFuelByIndex(index: number) {
    if (index >= 0 && index < this.fuelOptions.length) {
      this.fuelSliderIndex = index;
      this.fuelLevel = this.fuelOptions[index].value;
    }
  }

  onFuelSliderChange(event: any) {
    const val = parseInt(event.target.value, 10);
    this.setFuelByIndex(val);
  }

  getFuelBadgeClass(): string {
    if (this.fuelSliderIndex === 0) return 'bad';
    if (this.fuelSliderIndex <= 2) return 'warn';
    return 'ok';
  }

  // ==========================================
  // GETTERS MOTOR TERPILIH & ANTI-DUPLIKASI
  // ==========================================
  get selectedVehicle(): VehicleOption | undefined {
    if (!this.selectedVehicleId) return undefined;
    const found = this.vehicles.find((v) => v.id === this.selectedVehicleId);
    if (found) return found;
    if (this.selectedSlot?.vehicles) {
      const sv = this.selectedSlot.vehicles.find((v: any) => (v.vehicle_id ?? v.id) === this.selectedVehicleId);
      if (sv) {
        const vId = (sv.vehicle_id ?? sv.id) as number;
        if (vId) {
          return {
            id: vId,
            name: sv.name ?? sv.vehicle_name ?? `Motor #${vId}`,
            plate_number: sv.plate_number || '',
            type: (sv as any).type || 'motor',
            is_active: true
          };
        }
      }
    }
    return undefined;
  }

  get selectedVehicleName(): string {
    return this.selectedVehicle?.name || 'Pilih unit motor';
  }

  get selectedVehiclePlate(): string {
    return this.selectedVehicle?.plate_number ? `(${this.selectedVehicle.plate_number})` : '';
  }

  get completedVehicleMap(): Record<number, { submitted_by?: string | null; submitted_at?: string | null }> {
    const map: Record<number, { submitted_by?: string | null; submitted_at?: string | null }> = {};
    const targetSlot = this.selectedSlot || this.slots.find(s =>
      s.id === this.selectedScheduleId || s.form_schedule_id === this.selectedScheduleId
    ) || this.slots.find(s => s.status === 'open' || s.window_status === 'open') || this.slots[0];

    if (targetSlot?.vehicles) {
      for (const v of targetSlot.vehicles) {
        const vId = v.vehicle_id ?? v.id;
        if (vId && v.completed) {
          map[vId] = {
            submitted_by: v.submitted_by || 'Driver lain',
            submitted_at: v.submitted_at || null,
          };
        }
      }
    }
    return map;
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUserValue();
    return (user?.name || user?.username || '').trim().toLowerCase();
  }

  isCurrentUserInspector(vehicle: ChecksheetVehicleStatus): boolean {
    const currentName = this.getCurrentUserName();
    if (!currentName || !vehicle.submitted_by) return false;
    const submitted = vehicle.submitted_by.trim().toLowerCase();
    return submitted === currentName || submitted.includes(currentName) || currentName.includes(submitted);
  }

  hasCurrentUserInspectedSlot(slot: ChecksheetSlot): boolean {
    if (slot?.vehicles && slot.vehicles.length > 0) {
      return slot.vehicles.some((v) => v.completed && this.isCurrentUserInspector(v));
    }
    if (slot?.status === 'done' && slot?.submitted_by) {
      const currentName = this.getCurrentUserName();
      return currentName ? slot.submitted_by.toLowerCase().includes(currentName) : true;
    }
    return false;
  }

  getCurrentUserInspectedVehicleName(slot: ChecksheetSlot): string {
    if (!slot?.vehicles) return '';
    const v = slot.vehicles.find((item) => item.completed && this.isCurrentUserInspector(item));
    return v ? (v.name || v.vehicle_name || 'Motor') : '';
  }

  getCurrentUserVehicle(slot: ChecksheetSlot): ChecksheetVehicleStatus | undefined {
    if (!slot?.vehicles) return undefined;
    return slot.vehicles.find((item) => item.completed && this.isCurrentUserInspector(item));
  }

  getOtherVehicles(slot: ChecksheetSlot): ChecksheetVehicleStatus[] {
    if (!slot?.vehicles) return [];
    return slot.vehicles.filter((v) => !this.isCurrentUserInspector(v));
  }

  getSlotShortLabel(slot: any): string {
    if (!slot) return 'Slot';
    const name = (slot.phase || slot.slot_name || slot.title || '').toLowerCase();
    if (name.includes('pagi')) return 'Pagi';
    if (name.includes('siang')) return 'Siang (Wajib)';
    if (name.includes('sore')) return 'Sore';
    if (name.includes('malam')) return 'Malam';
    return slot.title || 'Slot';
  }

  get currentActiveSlot(): ChecksheetSlot | undefined {
    if (!this.slots || this.slots.length === 0) return undefined;
    return this.slots.find(s => (s.id || s.form_schedule_id) === this.activeSlotId) || this.slots[0];
  }

  // ==========================================
  // GETTERS PROGRES LANGKAH MODAL
  // ==========================================
  get stepMotorDone(): boolean {
    return this.selectedVehicleId != null;
  }

  get stepCekDone(): boolean {
    return !!(this.fuelLevel && this.vehicleCondition);
  }

  get stepFotoDone(): boolean {
    return this.evidencePhoto != null;
  }

  get activeStep(): number {
    if (!this.stepMotorDone) return 1;
    if (!this.stepCekDone) return 2;
    return 3;
  }

  ngOnInit() {
    this.branchSub = this.authService.getCurrentUser().subscribe((user) => {
      const branchId = user?.branch_id;
      if (branchId) {
        this.loadVehicles(branchId);
      }
    });
  }

  ngOnDestroy() {
    this.branchSub?.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadVehicles(branchId?: number | null) {
    const targetBranchId = branchId ?? this.authService.getCurrentUserValue()?.branch_id;
    this.driverService.getVehicles(targetBranchId).subscribe({
      next: (res) => {
        const raw = Array.isArray(res?.data) ? res.data : [];
        this.vehicles = raw.map((v: any) => ({
          id: v.id ?? v.vehicle_id,
          name: v.name ?? v.vehicle_name ?? `Motor #${v.id ?? v.vehicle_id}`,
          plate_number: v.plate_number || '',
          type: v.type,
          is_active: v.is_active ?? true
        }));
      },
      error: (err) => console.warn('Gagal memuat motor cabang:', err)
    });
  }

  loadData(event?: any) {
    if (!event && this.slots.length === 0) this.isLoading = true;
    this.errorMsg = '';

    this.driverService.getTodayChecksheets().subscribe({
      next: (res) => {
        const data = res?.data;
        if (Array.isArray(data)) {
          this.slots = data;
        } else if (Array.isArray(data?.slots)) {
          this.slots = data.slots;
        } else if (data?.phases) {
          this.slots = [
            ...(data.phases.pagi || []),
            ...(data.phases.siang || []),
            ...(data.phases.sore || []),
          ];
        } else {
          this.slots = [];
        }

        if (this.slots.length > 0) {
          const exists = this.slots.some(s => (s.id || s.form_schedule_id) === this.activeSlotId);
          if (!this.activeSlotId || !exists) {
            const openSlot = this.slots.find(s => s.status === 'open' || s.window_status === 'open');
            const siangSlot = this.slots.find(s => this.isSiangGatekeeper(s));
            const target = openSlot || siangSlot || this.slots[0];
            this.activeSlotId = target.id || target.form_schedule_id || null;
          }
        }

        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Gagal memuat jadwal inspeksi armada.';
        if (event) event.target.complete();
      }
    });

    const userBranchId = this.authService.getCurrentUserValue()?.branch_id;
    this.loadVehicles(userBranchId);
  }

  isSiangGatekeeper(slot: any): boolean {
    if (slot.is_checkout_gatekeeper || slot.is_gatekeeper) return true;
    const phase = (slot.phase || slot.slot_name || '').toLowerCase();
    const title = (slot.title || '').toLowerCase();
    return phase.includes('siang') || title.includes('siang');
  }

  // ==========================================
  // HANDLER MODAL PEMILIHAN MOTOR & CABANG (AJAX)
  // ==========================================
  openVehicleSelectModal() {
    if (!this.vehicles || this.vehicles.length === 0) {
      if (this.selectedSlot?.vehicles && this.selectedSlot.vehicles.length > 0) {
        this.vehicles = this.selectedSlot.vehicles.map((sv: any) => {
          const vId = (sv.vehicle_id ?? sv.id) as number;
          return {
            id: vId,
            name: sv.name ?? sv.vehicle_name ?? `Motor #${vId}`,
            plate_number: sv.plate_number || '',
            type: sv.type || 'motor',
            is_active: true
          };
        });
      } else {
        const userBranchId = this.authService.getCurrentUserValue()?.branch_id;
        this.loadVehicles(userBranchId);
      }
    }
    this.isVehicleModalOpen = true;
  }

  closeVehicleSelectModal() {
    this.isVehicleModalOpen = false;
  }

  onVehicleSelected(vehicle: VehicleOption) {
    this.selectedVehicleId = vehicle.id;
    this.isVehicleModalOpen = false;
  }

  loadDutyBranches() {
    this.branchService.getBranches().subscribe({
      next: (res: any) => {
        this.branches = Array.isArray(res?.data) ? res.data : [];
      },
      error: (err: any) => console.warn('Gagal memuat cabang:', err)
    });
  }

  openBranchModal() {
    if (this.branches.length === 0) {
      this.loadDutyBranches();
    }
    this.isBranchModalOpen = true;
  }

  closeBranchModal() {
    this.isBranchModalOpen = false;
  }

  onBranchSelected(branch: Branch) {
    this.isBranchModalOpen = false;
    this.authService.updateUserBranch(branch.id, branch.name);
    this.loadVehicles(branch.id);
    this.attendanceService.updateDutyBranch(branch.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: () => {
        this.loadData();
      }
    });
  }

  // Buka modal inspeksi langsung tanpa delay/chunk loading
  openVehicleForm(slot: any, vehicle: any) {
    if (slot && this.hasCurrentUserInspectedSlot(slot)) {
      const vName = this.getCurrentUserInspectedVehicleName(slot);
      this.toastCtrl.create({
        message: `Anda sudah menginspeksi ${vName || 'motor'} pada slot ini. Setiap driver hanya perlu 1 motor agar tugas terbagi adil.`,
        duration: 3500,
        color: 'warning',
        position: 'bottom'
      }).then(t => t.present());
      return;
    }
    this.openInspectionModal(slot, vehicle);
  }

  openQuickInspection(vehicleId?: number) {
    const targetSlot = this.slots.find(s => s.status === 'open' || s.window_status === 'open') || this.slots[0];
    if (targetSlot && this.hasCurrentUserInspectedSlot(targetSlot)) {
      const vName = this.getCurrentUserInspectedVehicleName(targetSlot);
      this.toastCtrl.create({
        message: `Anda sudah menginspeksi ${vName || 'motor'} pada slot ini. Setiap driver hanya perlu 1 motor agar tugas terbagi adil.`,
        duration: 3500,
        color: 'warning',
        position: 'bottom'
      }).then(t => t.present());
      return;
    }
    const v = vehicleId ? this.vehicles.find((item) => item.id === vehicleId) : undefined;
    this.openInspectionModal(targetSlot, v);
  }

  openInspectionModal(slot?: any, vehicle?: any) {
    const targetSlot = slot || this.slots.find(s => s.id === (slot?.form_schedule_id ?? slot?.id)) || this.slots.find(s => s.status === 'open' || s.window_status === 'open') || this.slots[0];
    if (targetSlot && this.hasCurrentUserInspectedSlot(targetSlot)) {
      const vName = this.getCurrentUserInspectedVehicleName(targetSlot);
      this.toastCtrl.create({
        message: `Anda sudah menginspeksi ${vName || 'motor'} pada slot ini. Setiap driver hanya perlu 1 motor agar tugas terbagi adil.`,
        duration: 3500,
        color: 'warning',
        position: 'bottom'
      }).then(t => t.present());
      return;
    }

    this.selectedSlot = targetSlot;
    this.selectedScheduleId = targetSlot?.form_schedule_id ?? targetSlot?.id ?? null;
    this.selectedSlotTitle = targetSlot?.title ?? 'Inspeksi Bensin & Armada';

    const completedMap = this.completedVehicleMap;

    let targetVehicleId = vehicle?.vehicle_id ?? vehicle?.id ?? null;
    // Jika motor yang dipilih sudah diinspeksi orang lain, batalkan pemilihan target ini
    if (targetVehicleId && completedMap[targetVehicleId]) {
      targetVehicleId = null;
    }

    // Auto-pick motor pertama yang belum di-inspeksi
    if (!targetVehicleId) {
      const available = this.vehicles.find((v) => !completedMap[v.id]);
      targetVehicleId = available ? available.id : (this.vehicles[0]?.id ?? null);
    }

    this.selectedVehicleId = targetVehicleId;

    this.setFuelByIndex(4); // Default Penuh (index 4 / 100%)
    this.tarpAvailable = true;
    this.raincoatAvailable = true;
    this.vehicleCondition = 'Layak Jalan';
    this.odometer = null;
    this.notes = '';
    this.showNotes = false;
    this.evidencePhoto = null;
    this.isModalOpen = true;
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'done':
        return 'ok';
      case 'open':
        return 'info';
      case 'late':
        return 'warn';
      case 'missed':
        return 'bad';
      default:
        return 'muted';
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async takePhoto() {
    try {
      const photo = await captureCompressedPhoto({
        direction: CameraDirection.Rear,
        maxWidth: 720,
        quality: 0.50,
        promptHeader: 'Foto Bukti Evidence Inspeksi',
      });
      if (photo) {
        this.evidencePhoto = photo;
      }
    } catch (err: any) {
      if (!err?.message?.toLowerCase().includes('cancel')) {
        const toast = await this.toastCtrl.create({
          message: 'Gagal membuka kamera: ' + (err?.message || 'Izin kamera diperlukan'),
          duration: 2500,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    }
  }

  clearPhoto() {
    this.evidencePhoto = null;
  }

  async submitInspection() {
    if (!this.selectedVehicleId) {
      const toast = await this.toastCtrl.create({
        message: 'Pilih unit motor terlebih dahulu.',
        duration: 2500,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    // Cek anti-duplikasi: apakah motor ini sudah diinput driver lain
    if (this.completedVehicleMap[this.selectedVehicleId]) {
      const inspector = this.completedVehicleMap[this.selectedVehicleId]?.submitted_by || 'driver lain';
      const alert = await this.alertCtrl.create({
        header: 'Motor Sudah Diinspeksi',
        message: `Unit motor ini sudah diinspeksi oleh ${inspector}. Silakan pilih unit motor lain yang Anda kendarai hari ini.`,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.evidencePhoto) {
      const toast = await this.toastCtrl.create({
        message: 'Foto bukti evidence wajib diambil sebelum mengirim!',
        duration: 2500,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();
      return;
    }

    if (!this.selectedScheduleId && this.slots.length > 0) {
      const targetSlot = this.selectedSlot || this.slots.find(s => s.status === 'open' || s.window_status === 'open') || this.slots[0];
      this.selectedScheduleId = targetSlot?.form_schedule_id ?? targetSlot?.id ?? null;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim inspeksi armada...' });
    await loading.present();

    const payload: any = {
      form_schedule_id: this.selectedScheduleId,
      vehicle_id: this.selectedVehicleId,
      answers: {
        fuel_level: this.fuelLevel,
        fuel_photo: this.evidencePhoto,
        tarp_available: this.tarpAvailable,
        raincoat_available: this.raincoatAvailable,
        vehicle_condition: this.vehicleCondition,
        odometer: this.odometer ? Number(this.odometer) : null,
        notes: this.notes ? this.notes.trim() : null,
      }
    };

    this.driverService.submitChecksheet('shared-inspeksi-bensin-armada', payload).subscribe({
      next: async (res) => {
        this.isSubmitting = false;
        await loading.dismiss();

        const eligibility = res?.data?.checkout_eligibility || res?.meta?.checkout_eligibility;
        if (eligibility) {
          this.attendanceService.updateCheckoutEligibility(eligibility);
        }

        this.closeModal();

        let successMsg = 'Laporan inspeksi armada berhasil dicatat. Syarat absen pulang siang Anda telah selesai.';
        if (this.isFuelBelowHalf) {
          successMsg += '\n\n⛽ PENGINGAT: Indikator bensin motor di bawah 1/2 (' + this.fuelLevel + '). Silakan segera isi bensin armada!';
        }

        const alert = await this.alertCtrl.create({
          header: 'Inspeksi Berhasil! 🎉',
          message: successMsg,
          buttons: ['OK']
        });
        await alert.present();

        this.loadData();
      },
      error: async (err) => {
        this.isSubmitting = false;
        await loading.dismiss();
        const msg = err.error?.message || err.message || 'Gagal mengirim inspeksi armada.';
        const alert = await this.alertCtrl.create({
          header: 'Gagal Kirim',
          message: msg,
          buttons: ['Tutup']
        });
        await alert.present();
      }
    });
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'done':
        return 'success';
      case 'open':
        return 'primary';
      case 'late':
        return 'warning';
      case 'missed':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'done':
        return 'Selesai';
      case 'open':
        return 'Dibuka';
      case 'late':
        return 'Terlambat';
      case 'missed':
        return 'Terlewat';
      case 'upcoming':
        return 'Akan Datang';
      default:
        return status || '-';
    }
  }

  doRefresh(event: any) {
    this.loadData(event);
  }
}
