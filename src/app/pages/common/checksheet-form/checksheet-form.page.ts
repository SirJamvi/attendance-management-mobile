import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonCheckbox, IonButton, IonIcon, IonSpinner, IonBadge, IonModal,
  AlertController, LoadingController, ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline, trashOutline, locationOutline, refreshOutline,
  checkmarkCircleOutline, alertCircleOutline, eyeOffOutline, warningOutline,
  carOutline, personOutline, closeOutline, sendOutline, snowOutline
} from 'ionicons/icons';
import { CameraDirection } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { DriverOperationsService } from 'src/app/services/driver-operations.service';
import { AttendanceService } from 'src/app/services/attendance';
import { AuthService } from 'src/app/services/auth';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { captureCompressedPhoto } from 'src/app/utils/image-compressor';
import {
  BlindCountReconciliation,
  ChecksheetFieldOption,
  ChecksheetFormField,
  ChecksheetFormSchema,
  ChecksheetSubmitPayload,
  DriverOption,
  OpnameProductItem,
  VehicleOption
} from 'src/app/types/api.types';

@Component({
  selector: 'app-checksheet-form',
  templateUrl: './checksheet-form.page.html',
  styleUrls: ['./checksheet-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonCheckbox, IonButton, IonIcon, IonSpinner, IonBadge, IonModal
  ]
})
export class ChecksheetFormPage implements OnInit {
  private route = inject(ActivatedRoute);
  private koService = inject(KoOperationsService);
  private driverService = inject(DriverOperationsService);
  private attendanceService = inject(AttendanceService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  slug = '';
  isDriverMode = false;
  formScheduleId: number | null = null;
  selectedVehicleId: number | null = null;
  selectedDriverId: number | null = null;

  isLoading = true;
  isSubmitting = false;
  errorMsg = '';

  formSchema: ChecksheetFormSchema | null = null;
  isBlindCount = false;
  vehicles: VehicleOption[] = [];
  drivers: DriverOption[] = [];
  opnameProducts: OpnameProductItem[] = [];

  answers: Record<string, any> = {};

  latitude: number | null = null;
  longitude: number | null = null;
  isLocating = false;

  // Blind Count Reconciliation Modal
  isReconciliationOpen = false;
  reconciliationData: BlindCountReconciliation | null = null;
  reconciliationStatus = '';

  constructor() {
    addIcons({
      cameraOutline, trashOutline, locationOutline, refreshOutline,
      checkmarkCircleOutline, alertCircleOutline, eyeOffOutline, warningOutline,
      carOutline, personOutline, closeOutline, sendOutline, snowOutline
    });
  }

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    const qp = this.route.snapshot.queryParamMap;
    const role = this.authService.getCurrentUserValue()?.role;

    const modeParam = qp.get('mode');
    this.isDriverMode = modeParam === 'driver' || (!modeParam && role === 'driver');

    const scheduleParam = qp.get('form_schedule_id');
    const vehicleParam = qp.get('vehicle_id');
    this.formScheduleId = scheduleParam ? Number(scheduleParam) : null;
    this.selectedVehicleId = vehicleParam ? Number(vehicleParam) : null;

    // Fast-path: pasang fallback schema instan agar form muncul 0ms tanpa menunggu jaringan
    const fallback = this.getFallbackSchema(this.slug);
    if (fallback) {
      this.formSchema = fallback;
      this.initAnswers(fallback.fields);
      this.isLoading = false;
    }

    this.loadForm();
  }

  get defaultBackHref(): string {
    return this.isDriverMode ? '/tabs/driver/inspection' : '/tabs/ko/checksheets';
  }

  get isGatepassForm(): boolean {
    return this.slug === 'ko-gatepass-rute-jauh';
  }

  get isOpnameForm(): boolean {
    return this.slug === 'ko-opname-stok';
  }

  onKulkasStockChange(item: OpnameProductItem) {
    const k1 = Number(item.kulkas_1) || 0;
    const k2 = Number(item.kulkas_2) || 0;
    const k3 = Number(item.kulkas_3) || 0;
    item.actual_stock = k1 + k2 + k3;

    // Otomatis akumulasikan ke field standard actual_stock (Total Bal Es)
    const grandTotal = this.opnameProducts.reduce((sum, p) => sum + (Number(p.actual_stock) || 0), 0);
    this.answers['actual_stock'] = grandTotal;
  }

  private getFallbackSchema(slug: string): ChecksheetFormSchema | null {
    if (slug === 'shared-inspeksi-bensin-armada') {
      return {
        id: 0,
        slug: 'shared-inspeksi-bensin-armada',
        title: 'Inspeksi Bensin & Kondisi Armada',
        description: 'Form kolaboratif untuk pengecekan bensin, terpal, dan kelayakan motor operasional.',
        requires_vehicle: true,
        fields: [
          {
            field_key: 'fuel_level',
            label: 'Level Bensin',
            field_type: 'select',
            options: ['Penuh', '3/4', '1/2', '1/4', 'Hampir Habis'],
            is_required: true,
            sort_order: 1,
          },
          {
            field_key: 'fuel_photo',
            label: 'Foto Indikator Bensin / Speedometer',
            field_type: 'photo',
            is_required: true,
            sort_order: 2,
          },
          {
            field_key: 'tarp_available',
            label: 'Terpal / Penutup Es Tersedia & Layak',
            field_type: 'checklist',
            is_required: true,
            sort_order: 3,
          },
          {
            field_key: 'vehicle_condition',
            label: 'Kondisi Armada',
            field_type: 'select',
            options: ['Layak Jalan', 'Perlu Servis Ringan', 'Mogok / Rusak'],
            is_required: true,
            sort_order: 4,
          },
          {
            field_key: 'odometer',
            label: 'Angka Odometer (KM)',
            field_type: 'number',
            is_required: false,
            placeholder: 'Contoh: 12500',
            sort_order: 5,
          },
          {
            field_key: 'notes',
            label: 'Catatan Kondisi Kendaraan',
            field_type: 'textarea',
            is_required: false,
            placeholder: 'Catatan opsional jika ada kendala...',
            sort_order: 6,
          },
        ]
      };
    }
    return null;
  }

  loadForm() {
    if (!this.formSchema) {
      this.isLoading = true;
    }
    this.errorMsg = '';

    const params = {
      form_schedule_id: this.formScheduleId,
      vehicle_id: this.selectedVehicleId,
    };

    const req$ = this.isDriverMode
      ? this.driverService.getChecksheetForm(this.slug, params)
      : this.koService.getChecksheetForm(this.slug, params);

    req$.subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        const formObj: ChecksheetFormSchema = data.form || data;
        const meta = data.meta || res?.meta || {};

        if (formObj && Array.isArray(formObj.fields) && formObj.fields.length > 0) {
          this.formSchema = formObj;
          this.isBlindCount = !!(meta.is_blind_count || this.slug === 'kasir-closing-pos');
          this.initAnswersPreserving(formObj.fields);
        }

        const rawVehicles = Array.isArray(data.vehicles)
          ? data.vehicles
          : (Array.isArray(meta.vehicles) ? meta.vehicles : (Array.isArray(data) ? data : []));

        if (rawVehicles.length > 0) {
          this.vehicles = rawVehicles.map((v: any) => ({
            id: v.id ?? v.vehicle_id,
            name: v.name ?? v.vehicle_name ?? `Motor #${v.id ?? v.vehicle_id}`,
            plate_number: v.plate_number || '',
            status: v.status || v.vehicle_status || 'active',
          }));

          if (!this.selectedVehicleId && this.vehicles.length === 1) {
            this.selectedVehicleId = this.vehicles[0].id;
          }
        }

        this.drivers = Array.isArray(meta.drivers) ? meta.drivers : [];

        if (meta.opname_products && Array.isArray(meta.opname_products)) {
          this.opnameProducts = meta.opname_products.map((p: any) => ({
            ...p,
            kulkas_1: 0,
            kulkas_2: 0,
            kulkas_3: 0,
            actual_stock: 0,
            notes: '',
          }));
        }

        if (!this.formScheduleId && meta.active_schedule_id) {
          this.formScheduleId = Number(meta.active_schedule_id);
        } else if (!this.formScheduleId && (formObj.active_schedules?.length || (formObj as any).activeSchedules?.length)) {
          const firstSched = formObj.active_schedules?.[0] || (formObj as any).activeSchedules?.[0];
          this.formScheduleId = Number(firstSched.id);
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        if (!this.formSchema) {
          this.errorMsg = err.error?.message || 'Gagal memuat formulir checksheet.';
        }
      }
    });
  }

  private initAnswers(fields: ChecksheetFormField[]) {
    const initial: Record<string, any> = {};
    for (const field of fields) {
      const key = this.getFieldKey(field);
      if (!key) continue;

      if (field.default_value !== undefined && field.default_value !== null) {
        initial[key] = field.default_value;
      } else if (field.field_type === 'checklist' || field.field_type === 'boolean') {
        initial[key] = false;
      } else {
        initial[key] = '';
      }
    }
    this.answers = initial;
  }

  private initAnswersPreserving(fields: ChecksheetFormField[]) {
    for (const field of fields) {
      const key = this.getFieldKey(field);
      if (!key) continue;
      if (this.answers[key] === undefined) {
        if (field.default_value !== undefined && field.default_value !== null) {
          this.answers[key] = field.default_value;
        } else if (field.field_type === 'checklist' || field.field_type === 'boolean') {
          this.answers[key] = false;
        } else {
          this.answers[key] = '';
        }
      }
    }
  }

  getFieldKey(field: ChecksheetFormField): string {
    return field.field_key || field.key || '';
  }

  isFieldRequired(field: ChecksheetFormField): boolean {
    return !!(field.required ?? field.is_required);
  }

  getNormalizedOptions(field: ChecksheetFormField): ChecksheetFieldOption[] {
    if (!Array.isArray(field.options)) return [];
    return field.options.map((opt) =>
      typeof opt === 'string'
        ? { label: opt, value: opt }
        : { label: opt.label ?? opt.value, value: opt.value ?? opt.label }
    );
  }

  hasExplicitDriverField(): boolean {
    return (this.formSchema?.fields || []).some((f) => this.getFieldKey(f) === 'driver_id');
  }

  async captureLocation(silent = false) {
    if (this.isLocating) return;
    this.isLocating = true;
    try {
      const pos: any = await Promise.race([
        Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 2500,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GPS_TIMEOUT')), 3000)),
      ]);
      if (pos?.coords) {
        this.latitude = pos.coords.latitude;
        this.longitude = pos.coords.longitude;
      }
    } catch {
      try {
        const coarsePos: any = await Promise.race([
          Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 1500,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('GPS_COARSE_TIMEOUT')), 2000)),
        ]);
        if (coarsePos?.coords) {
          this.latitude = coarsePos.coords.latitude;
          this.longitude = coarsePos.coords.longitude;
        }
      } catch {
        if (!silent) {
          console.warn('⚠️ Koordinat GPS tidak dapat diperoleh saat ini.');
        }
      }
    } finally {
      this.isLocating = false;
    }
  }

  async takeFieldPhoto(fieldKey: string, label: string) {
    try {
      const compressed = await captureCompressedPhoto({
        direction: CameraDirection.Rear,
        maxWidth: 720,
        quality: 0.50,
        promptHeader: `Foto: ${label}`,
      });
      if (compressed) {
        this.answers[fieldKey] = compressed;
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

  clearFieldPhoto(fieldKey: string) {
    this.answers[fieldKey] = '';
  }

  formatRupiahPreview(val: any): string {
    const num = Number(val);
    if (isNaN(num) || val === '' || val === null || val === undefined) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  private validateForm(): string | null {
    if (!this.formSchema) return 'Formulir belum siap.';

    if (this.formSchema.requires_vehicle && !this.selectedVehicleId) {
      return 'Silakan pilih armada motor terlebih dahulu.';
    }

    if (this.isGatepassForm && this.drivers.length > 0 && !this.selectedDriverId && !this.answers['driver_id']) {
      return 'Silakan pilih driver untuk Gatepass Rute Jauh.';
    }

    for (const field of this.formSchema.fields || []) {
      const key = this.getFieldKey(field);
      if (!key || !this.isFieldRequired(field)) continue;

      const value = this.answers[key];
      if (field.field_type === 'checklist' || field.field_type === 'boolean') {
        continue;
      }
      if (value === null || value === undefined || String(value).trim() === '') {
        return `Field "${field.label}" wajib diisi.`;
      }
    }

    return null;
  }

  async submitForm() {
    const validationErr = this.validateForm();
    if (validationErr) {
      await this.showToast(validationErr, 'warning');
      return;
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim checksheet...' });
    await loading.present();

    const sanitizedAnswers: Record<string, any> = {};
    for (const field of this.formSchema?.fields || []) {
      const key = this.getFieldKey(field);
      if (!key) continue;
      const val = this.answers[key];
      if (field.field_type === 'number' || field.field_type === 'currency') {
        sanitizedAnswers[key] = val === '' || val === null || val === undefined ? null : Number(val);
      } else if (field.field_type === 'checklist' || field.field_type === 'boolean') {
        sanitizedAnswers[key] = !!val;
      } else {
        sanitizedAnswers[key] = val;
      }
    }

    if (this.isGatepassForm && this.selectedDriverId) {
      sanitizedAnswers['driver_id'] = this.selectedDriverId;
    }

    // Jika koordinat GPS belum sempat didapat, coba ambil cepat secara aman
    if (this.latitude === null || this.longitude === null) {
      await this.captureLocation(true);
    }

    const payload: ChecksheetSubmitPayload = {
      answers: sanitizedAnswers,
    };

    if (this.formScheduleId) {
      payload.form_schedule_id = this.formScheduleId;
    }
    if (this.selectedVehicleId) {
      payload.vehicle_id = this.selectedVehicleId;
    }
    if (this.isGatepassForm && this.selectedDriverId) {
      payload.driver_id = this.selectedDriverId;
    }
    if (this.latitude !== null && this.longitude !== null) {
      payload.latitude = this.latitude;
      payload.longitude = this.longitude;
    }

    if (this.isOpnameForm && this.opnameProducts.length > 0) {
      payload.items = this.opnameProducts.map(p => ({
        inventory_id: p.inventory_id,
        product_id: p.product_id,
        actual_stock: Number(p.actual_stock) || 0,
        notes: p.notes || null,
        kulkas_1: Number(p.kulkas_1) || 0,
        kulkas_2: Number(p.kulkas_2) || 0,
        kulkas_3: Number(p.kulkas_3) || 0,
      }));
    }

    if (this.isBlindCount && sanitizedAnswers['actual_cash_drawer'] !== undefined) {
      payload.actual_cash_drawer = sanitizedAnswers['actual_cash_drawer'];
    }

    const submit$ = this.isDriverMode
      ? this.driverService.submitChecksheet(this.slug, payload)
      : this.koService.submitChecksheet(this.slug, payload);

    submit$.subscribe({
      next: async (res: any) => {
        this.isSubmitting = false;
        await loading.dismiss();

        const data = res?.data || {};

        // Update Driver Checkout Eligibility immediately!
        const eligibility = data.checkout_eligibility || res?.meta?.checkout_eligibility;
        if (this.isDriverMode && eligibility) {
          this.attendanceService.updateCheckoutEligibility(eligibility);
        }

        // Handle Blind Count Reconciliation Result
        const recon = data.reconciliation || (
          data.pos_expected_cash !== undefined || data.actual_cash_drawer !== undefined
            ? {
                pos_expected_cash: Number(data.pos_expected_cash ?? 0),
                actual_cash_drawer: Number(data.actual_cash_drawer ?? 0),
                cash_variance: Number(data.cash_variance ?? 0),
                shortage_amount: Number(data.shortage_amount ?? 0),
                status: data.status,
              }
            : null
        );

        if (this.isBlindCount && recon) {
          this.reconciliationData = recon;
          this.reconciliationStatus = recon.status || data.status || '';
          this.isReconciliationOpen = true;
          return;
        }

        await this.showToast(res?.message || 'Checksheet berhasil dikirim!', 'success');
        this.navCtrl.back();
      },
      error: async (err: any) => {
        this.isSubmitting = false;
        await loading.dismiss();

        // HTTP 409: Collaborative dedup conflict
        if (err.status === 409) {
          const alert = await this.alertCtrl.create({
            header: 'Sudah Dikerjakan',
            message:
              err.error?.message ||
              'Checksheet untuk slot/armada ini sudah diisi oleh rekan Anda.',
            buttons: [
              {
                text: 'Kembali & Refresh',
                handler: () => {
                  this.navCtrl.back();
                },
              },
            ],
          });
          await alert.present();
          return;
        }

        // HTTP 422: Validation error
        if (err.status === 422) {
          const firstFieldErr = this.extractValidationMessage(err.error);
          await this.showToast(firstFieldErr, 'danger');
          return;
        }

        await this.showToast(
          err.error?.message || 'Gagal mengirim checksheet. Coba lagi.',
          'danger'
        );
      }
    });
  }

  closeReconciliationAndBack() {
    this.isReconciliationOpen = false;
    this.navCtrl.back();
  }

  private extractValidationMessage(errBody: any): string {
    if (errBody?.errors && typeof errBody.errors === 'object') {
      const firstKey = Object.keys(errBody.errors)[0];
      const msgs = errBody.errors[firstKey];
      if (Array.isArray(msgs) && msgs.length > 0) {
        return msgs[0];
      }
    }
    return errBody?.message || 'Periksa kembali isian formulir Anda.';
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 3000,
      position: 'bottom',
    });
    await toast.present();
  }
}
