import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  IonModal, IonCheckbox, IonInput, IonTextarea, IonFooter,
  ToastController, LoadingController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline, bicycleOutline, checkmarkCircleOutline, timeOutline,
  lockClosedOutline, alertCircleOutline, addCircleOutline, cameraOutline,
  trashOutline, closeOutline, sendOutline, shieldCheckmarkOutline, imageOutline,
  checkmark, chevronForward, checkmarkCircle, storefrontOutline, close
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
    IonModal, IonCheckbox, IonInput, IonTextarea, IonFooter
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

  fuelLevel = 'Penuh';
  fuelOptions = [
    { value: 'Hampir Habis', label: 'Habis' },
    { value: '1/4', label: '1/4' },
    { value: '1/2', label: '1/2' },
    { value: '3/4', label: '3/4' },
    { value: 'Penuh', label: 'Penuh' }
  ];

  tarpAvailable = true; // Jas Hujan & Terpal

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
      checkmark, chevronForward, checkmarkCircle, storefrontOutline, close
    });
  }

  // ==========================================
  // GETTERS MOTOR TERPILIH & ANTI-DUPLIKASI
  // ==========================================
  get selectedVehicle(): VehicleOption | undefined {
    if (!this.selectedVehicleId) return undefined;
    return this.vehicles.find((v) => v.id === this.selectedVehicleId);
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

    this.fuelLevel = 'Penuh';
    this.tarpAvailable = true;
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

        const alert = await this.alertCtrl.create({
          header: 'Inspeksi Berhasil! 🎉',
          message: 'Laporan inspeksi armada berhasil dicatat. Syarat absen pulang siang Anda telah selesai.',
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
