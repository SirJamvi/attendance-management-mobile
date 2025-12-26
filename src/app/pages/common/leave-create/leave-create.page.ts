import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, NavController } from '@ionic/angular';

import { CameraViewComponent } from 'src/app/components/camera-view/camera-view.component';
import { LeaveService } from 'src/app/services/leave';
import { AuthService } from 'src/app/services/auth';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-leave-create',
  templateUrl: './leave-create.page.html',
  styleUrls: ['./leave-create.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    CommonModule, 
    FormsModule,
    CameraViewComponent,
    LoadingSpinnerComponent
  ]
})
export class LeaveCreatePage implements OnInit {

  leaveType: string = '';
  leaveTypeLabel: string = 'Pilih jenis cuti';
  startDate: string = '';
  endDate: string = '';
  reason: string = '';
  attachmentBase64: string | null = null;
  isSubmitting = false;
  
  leaveTypes = [
    { value: 'Tahunan', label: 'Cuti Tahunan' },
    { value: 'Sakit', label: 'Sakit (Wajib Surat Dokter)' },
    { value: 'Izin', label: 'Izin Khusus' }
  ];

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    const today = new Date();
    this.startDate = this.formatDateForInput(today);
    this.endDate = this.formatDateForInput(today);
    console.log('✅ Page initialized');
  }

  /**
   * Format date untuk display (DD/MM/YYYY)
   */
  formatDate(dateString: string): string {
    if (!dateString) return 'Pilih tanggal';
    
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Format date untuk input (YYYY-MM-DD)
   */
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse date string ke Date object
   */
  parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Open Leave Type Selector
   */
  async openLeaveTypeSelector() {
    console.log('🖱️ Opening leave type selector');
    
    const alert = await this.alertCtrl.create({
      header: 'Pilih Jenis Cuti',
      inputs: [
        {
          type: 'radio',
          label: 'Cuti Tahunan',
          value: 'Tahunan',
          checked: this.leaveType === 'Tahunan'
        },
        {
          type: 'radio',
          label: 'Sakit (Wajib Surat Dokter)',
          value: 'Sakit',
          checked: this.leaveType === 'Sakit'
        },
        {
          type: 'radio',
          label: 'Izin Khusus',
          value: 'Izin',
          checked: this.leaveType === 'Izin'
        }
      ],
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Pilih',
          handler: (value) => {
            if (value) {
              this.leaveType = value;
              const selected = this.leaveTypes.find(t => t.value === value);
              this.leaveTypeLabel = selected ? selected.label : value;
              console.log('✅ Selected:', value);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Open Start Date Picker - Menggunakan input date HTML5
   */
  async openStartDatePicker() {
    console.log('📅 Opening start date picker');
    
    const alert = await this.alertCtrl.create({
      header: 'Tanggal Mulai',
      inputs: [
        {
          name: 'date',
          type: 'date',
          value: this.startDate,
          min: this.formatDateForInput(new Date()),
        }
      ],
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: (data) => {
            if (data.date) {
              this.startDate = data.date;
              console.log('✅ Start date selected:', this.startDate);
              
              // Auto-adjust end date jika lebih kecil dari start date
              if (this.endDate && this.endDate < this.startDate) {
                this.endDate = this.startDate;
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Open End Date Picker
   */
  async openEndDatePicker() {
    console.log('📅 Opening end date picker');
    
    const alert = await this.alertCtrl.create({
      header: 'Tanggal Selesai',
      inputs: [
        {
          name: 'date',
          type: 'date',
          value: this.endDate,
          min: this.startDate || this.formatDateForInput(new Date()),
        }
      ],
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: (data) => {
            if (data.date) {
              this.endDate = data.date;
              console.log('✅ End date selected:', this.endDate);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Open Reason Input
   */
  async openReasonInput() {
    console.log('📝 Opening reason input');
    
    const alert = await this.alertCtrl.create({
      header: 'Alasan Cuti',
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Jelaskan alasan cuti Anda...',
          value: this.reason,
          attributes: {
            rows: 4
          }
        }
      ],
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: (data) => {
            if (data.reason && data.reason.trim()) {
              this.reason = data.reason.trim();
              console.log('✅ Reason entered:', this.reason.substring(0, 50));
            }
          }
        }
      ]
    });

    await alert.present();
  }

  handleAttachment(photoBase64: string | null) {
    this.attachmentBase64 = photoBase64;
    console.log('📸 Attachment received:', photoBase64 ? 'Yes' : 'No');
  }

  async onSubmit() {
    console.log('📤 Form submitted');
    console.log('Form data:', {
      leaveType: this.leaveType,
      startDate: this.startDate,
      endDate: this.endDate,
      reason: this.reason,
      hasAttachment: !!this.attachmentBase64
    });
    
    if (!this.leaveType || !this.startDate || !this.endDate || !this.reason) {
      await this.showAlert('Gagal', 'Mohon lengkapi semua kolom yang wajib diisi.');
      return;
    }

    if (this.leaveType === 'Sakit' && !this.attachmentBase64) {
      await this.showAlert('Gagal', 'Untuk cuti sakit, Anda wajib melampirkan foto surat dokter.');
      return;
    }

    // Validasi tanggal
    if (this.endDate < this.startDate) {
      await this.showAlert('Gagal', 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
      return;
    }

    const formData = new FormData();
    formData.append('type', this.leaveType);
    formData.append('start_date', this.startDate); 
    formData.append('end_date', this.endDate);
    formData.append('reason', this.reason);

    if (this.attachmentBase64) {
      const blob = this.base64ToBlob(this.attachmentBase64);
      formData.append('attachment', blob, 'surat-dokter.jpg'); 
    }

    this.isSubmitting = true;
    const loading = await this.loadingCtrl.create({ message: 'Mengirim pengajuan...' });
    await loading.present();

    this.leaveService.submitLeave(formData).subscribe({
      next: async (response: any) => {
        console.log('✅ Submit berhasil:', response);
        loading.dismiss();
        this.isSubmitting = false;
        await this.showAlert('Berhasil', 'Pengajuan cuti berhasil dikirim.');
        this.goBack();
      },
      error: (err: any) => {
        console.error('❌ Submit gagal:', err);
        loading.dismiss();
        this.isSubmitting = false;
        const msg = err.error?.message || 'Gagal mengirim pengajuan. Silakan coba lagi.';
        this.showAlert('Gagal', msg);
      }
    });
  }

  goBack() {
    const user = this.authService.getCurrentUserValue();
    if (user?.role.slug === 'driver') {
      this.navCtrl.navigateBack('/tabs/driver/leave');
    } else if (user?.role.slug === 'sales') {
      this.navCtrl.navigateBack('/tabs/sales/leave');
    } else {
      this.navCtrl.navigateBack('/tabs');
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  base64ToBlob(base64: string): Blob {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}