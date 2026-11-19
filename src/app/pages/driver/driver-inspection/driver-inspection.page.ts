import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
  IonModal, IonItem, IonSelect, IonSelectOption, IonCheckbox, IonInput, IonTextarea,
  ToastController, LoadingController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline, bicycleOutline, checkmarkCircleOutline, timeOutline,
  lockClosedOutline, alertCircleOutline, addCircleOutline, cameraOutline,
  trashOutline, closeOutline, sendOutline, shieldCheckmarkOutline, imageOutline
} from 'ionicons/icons';

import { DriverOperationsService } from 'src/app/services/driver-operations.service';
import { AttendanceService } from 'src/app/services/attendance';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { ChecksheetSlot, ChecksheetVehicleStatus, VehicleOption } from 'src/app/types/api.types';
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
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonBadge, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
    IonModal, IonItem, IonSelect, IonSelectOption, IonCheckbox, IonInput, IonTextarea
  ]
})
export class DriverInspectionPage implements OnInit {
  private driverService = inject(DriverOperationsService);
  private attendanceService = inject(AttendanceService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);

  isLoading = true;
  errorMsg = '';

  slots: ChecksheetSlot[] = [];
  vehicles: VehicleOption[] = [];

  // ==========================================
  // STATE MODAL INSPEKSI ARMADA SIMPEL
  // ==========================================
  isModalOpen = false;
  isSubmitting = false;

  selectedScheduleId: number | null = null;
  selectedSlotTitle = 'Inspeksi Bensin & Armada';
  selectedVehicleId: number | null = null;

  fuelLevel = 'Penuh';
  fuelOptions = ['Penuh', '3/4', '1/2', '1/4', 'Hampir Habis'];

  tarpAvailable = true; // Jas Hujan & Terpal

  vehicleCondition = 'Layak Jalan';
  conditionOptions = [
    { label: 'Layak Jalan', value: 'Layak Jalan' },
    { label: 'Perlu Servis Ringan', value: 'Perlu Servis Ringan' },
    { label: 'Mogok / Rusak', value: 'Mogok / Rusak' },
  ];

  odometer: number | null = null;
  notes = '';
  evidencePhoto: string | null = null;

  constructor() {
    addIcons({
      speedometerOutline, bicycleOutline, checkmarkCircleOutline, timeOutline,
      lockClosedOutline, alertCircleOutline, addCircleOutline, cameraOutline,
      trashOutline, closeOutline, sendOutline, shieldCheckmarkOutline, imageOutline
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadData();
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

    this.driverService.getVehicles().subscribe({
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
      error: () => {}
    });
  }

  isSiangGatekeeper(slot: any): boolean {
    if (slot.is_checkout_gatekeeper || slot.is_gatekeeper) return true;
    const phase = (slot.phase || slot.slot_name || '').toLowerCase();
    const title = (slot.title || '').toLowerCase();
    return phase.includes('siang') || title.includes('siang');
  }

  // Buka modal inspeksi langsung tanpa delay/chunk loading
  openVehicleForm(slot: any, vehicle: any) {
    this.openInspectionModal(slot, vehicle);
  }

  openQuickInspection(vehicleId?: number) {
    const v = vehicleId ? this.vehicles.find((item) => item.id === vehicleId) : undefined;
    this.openInspectionModal(undefined, v);
  }

  openInspectionModal(slot?: any, vehicle?: any) {
    this.selectedScheduleId = slot?.form_schedule_id ?? slot?.id ?? null;
    this.selectedSlotTitle = slot?.title ?? 'Inspeksi Bensin & Armada';

    const targetVehicleId = vehicle?.vehicle_id ?? vehicle?.id ?? (this.vehicles[0]?.id ?? null);
    this.selectedVehicleId = targetVehicleId;

    this.fuelLevel = 'Penuh';
    this.tarpAvailable = true;
    this.vehicleCondition = 'Layak Jalan';
    this.odometer = null;
    this.notes = '';
    this.evidencePhoto = null;
    this.isModalOpen = true;
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
