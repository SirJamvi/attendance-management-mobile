import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController, ToastController, NavController } from '@ionic/angular';
import { DeliveryService } from 'src/app/services/delivery';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-delivery-proof',
  templateUrl: './delivery-proof.page.html',
  styleUrls: ['./delivery-proof.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class DeliveryProofPage implements OnInit {
  private deliveryService = inject(DeliveryService);
  private loadingCtrl    = inject(LoadingController);
  private toastCtrl      = inject(ToastController);
  private navCtrl        = inject(NavController);

  // ── Form Data ──
  formData = {
    customer_id: null as number | null,
    butterfly_customer_name: '',
    qty_20kg: 0,
    qty_b_half: 0,
    qty_half: 0,
    payment_method: 'Cash',
    payment_note: '',
    latitude: '',
    longitude: '',
    proof_image: ''
  };

  previewImage: string | undefined;

  // ── Customer Dropdown ──
  allCustomers: any[]       = [];
  filteredCustomers: any[]  = [];
  customerSearchQuery       = '';
  showCustomerDropdown      = false;
  selectedCustomer: any     = null;
  isNewCustomer             = false;
  isLoadingCustomers        = false;

  // ── Payment Method Dropdown ──
  showPaymentDropdown = false;

  paymentMethods = [
    {
      value: 'Cash',
      label: 'Tunai (Cash)',
      desc:  'Bayar langsung di tempat',
      icon:  'cash-outline'
    },
    {
      value: 'Transfer Bank',
      label: 'Transfer Bank',
      desc:  'BCA, BRI, Mandiri, dll.',
      icon:  'card-outline'
    },
    {
      value: 'Dana',
      label: 'DANA',
      desc:  'Dompet digital DANA',
      icon:  'wallet-outline'
    },
    {
      value: 'QRIS',
      label: 'QRIS',
      desc:  'Scan kode QR',
      icon:  'qr-code-outline'
    }
  ];

  constructor() {}

  ngOnInit() {
    this.loadCustomers();
  }

  // ─────────────────────────────────────────────
  // PAYMENT DROPDOWN
  // ─────────────────────────────────────────────

  togglePaymentDropdown() {
    this.showPaymentDropdown = !this.showPaymentDropdown;
    if (this.showPaymentDropdown) {
      this.showCustomerDropdown = false;
    }
  }

  selectPayment(value: string) {
    this.formData.payment_method = value;
    this.showPaymentDropdown = false;
  }

  getPaymentLabel(value: string): string {
    return this.paymentMethods.find(m => m.value === value)?.label ?? value;
  }

  getPaymentIcon(value: string): string {
    return this.paymentMethods.find(m => m.value === value)?.icon ?? 'cash-outline';
  }

  // ─────────────────────────────────────────────
  // CUSTOMER DROPDOWN
  // ─────────────────────────────────────────────

  loadCustomers() {
    this.isLoadingCustomers = true;
    this.deliveryService.getCustomerList().subscribe({
      next: (res: any) => {
        this.allCustomers      = res.data || res.result || [];
        this.filteredCustomers = [...this.allCustomers];
        this.isLoadingCustomers = false;
      },
      error: (err: any) => {
        console.error('Gagal load customers', err);
        this.isLoadingCustomers = false;
      }
    });
  }

  onCustomerInput(event: any) {
    const query = (event.target?.value || '').toLowerCase().trim();
    this.customerSearchQuery = event.target?.value || '';
    this.selectedCustomer    = null;
    this.formData.customer_id = null;
    this.isNewCustomer       = false;

    this.filteredCustomers = query
      ? this.allCustomers.filter(c => c.name.toLowerCase().includes(query))
      : [...this.allCustomers];

    this.showCustomerDropdown  = true;
    this.showPaymentDropdown   = false;
  }

  onCustomerFocus() {
    this.filteredCustomers = this.customerSearchQuery
      ? this.allCustomers.filter(c =>
          c.name.toLowerCase().includes(this.customerSearchQuery.toLowerCase()))
      : [...this.allCustomers];
    this.showCustomerDropdown = true;
    this.showPaymentDropdown  = false;
  }

  onCustomerBlur() {
    setTimeout(() => { this.showCustomerDropdown = false; }, 200);
  }

  selectCustomer(customer: any) {
    this.selectedCustomer                 = customer;
    this.formData.customer_id             = customer.id;
    this.formData.butterfly_customer_name = customer.name;
    this.customerSearchQuery              = customer.name;
    this.showCustomerDropdown             = false;
    this.isNewCustomer                    = false;
  }

  useAsNewCustomer() {
    this.selectedCustomer                 = null;
    this.formData.customer_id             = null;
    this.formData.butterfly_customer_name = this.customerSearchQuery;
    this.isNewCustomer                    = true;
    this.showCustomerDropdown             = false;
  }

  clearCustomer() {
    this.selectedCustomer                 = null;
    this.isNewCustomer                    = false;
    this.formData.customer_id             = null;
    this.formData.butterfly_customer_name = '';
    this.customerSearchQuery              = '';
    this.filteredCustomers                = [...this.allCustomers];
    this.showCustomerDropdown             = false;
  }

  // ─────────────────────────────────────────────
  // KAMERA & GPS
  // ─────────────────────────────────────────────

  /**
   * Ambil koordinat GPS.
   * - enableHighAccuracy: false  → pakai sinyal jaringan/WiFi dulu, lebih cepat
   * - timeout: 30000            → tunggu hingga 30 detik (default sebelumnya ~10 detik)
   * - maximumAge: 60000         → boleh pakai cache lokasi selama 60 detik terakhir
   *
   * Fungsi ini tidak menampilkan toast error karena dipanggil di background
   * setelah foto diambil — biarkan submitDelivery() yang handle jika masih gagal.
   */
  async getLocation(): Promise<boolean> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
      });
      this.formData.latitude  = position.coords.latitude.toString();
      this.formData.longitude = position.coords.longitude.toString();
      console.log('✅ GPS terkunci:', this.formData.latitude, this.formData.longitude);
      return true;
    } catch (error) {
      console.error('⚠️ getLocation() gagal:', error);
      this.formData.latitude  = '';
      this.formData.longitude = '';
      return false;
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      this.previewImage         = `data:image/jpeg;base64,${image.base64String}`;
      this.formData.proof_image = this.previewImage;

      // Panggil GPS di background — tidak ditunggu (fire and forget).
      // Hasilnya akan siap saat driver selesai mengisi form dan menekan Kirim.
      this.getLocation();
    } catch (error) {
      console.error('Kamera dibatalkan / error', error);
    }
  }

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────

  async submitDelivery() {
    // ── Validasi form ──
    if (!this.formData.butterfly_customer_name?.trim()) {
      return this.showToast('Nama warung/pelanggan wajib diisi!', 'warning');
    }

    const totalQty =
      (this.formData.qty_half   || 0) +
      (this.formData.qty_20kg   || 0) +
      (this.formData.qty_b_half || 0);

    if (totalQty === 0) {
      return this.showToast('Masukkan minimal 1 bal es yang dikirim!', 'warning');
    }

    if (!this.formData.proof_image) {
      return this.showToast('Bukti foto wajib dilampirkan!', 'warning');
    }

    // ── GPS: coba ambil ulang jika belum tersedia ──
    if (!this.formData.latitude || !this.formData.longitude) {
      const gpsLoading = await this.loadingCtrl.create({
        message: 'Mengunci lokasi GPS, mohon tunggu...',
        spinner: 'crescent'
      });
      await gpsLoading.present();

      const gpsOk = await this.getLocation();
      await gpsLoading.dismiss();

      if (!gpsOk) {
        return this.showToast(
          'Gagal mendapatkan lokasi GPS. Pastikan GPS aktif, lalu coba lagi.',
          'danger'
        );
      }
    }

    // ── Kirim ke server ──
    const loading = await this.loadingCtrl.create({
      message: 'Mengirim bukti pengiriman...',
      spinner: 'crescent'
    });
    await loading.present();

    this.deliveryService.submitDeliveryProof(this.formData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        if (res.status === 'success') {
          this.showToast('Bukti berhasil dikirim! Menunggu validasi admin.', 'success');
          this.navCtrl.back();
        } else {
          this.showToast(res.message || 'Terjadi kesalahan sistem', 'danger');
        }
      },
      error: async (err: any) => {
        await loading.dismiss();
        console.error('Error submit:', err);
        this.showToast('Gagal terhubung ke server', 'danger');
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}