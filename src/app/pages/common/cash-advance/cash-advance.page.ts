import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CashAdvanceService } from 'src/app/services/cash-advance/cash-advance.service';

@Component({
  selector: 'app-cash-advance',
  templateUrl: './cash-advance.page.html',
  styleUrls: ['./cash-advance.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CashAdvancePage implements OnInit {
  history: any[] = [];
  isLoading = true;
  isSubmitting = false;

  amount: number | null = null;
  duration: number = 1;
  reason: string = '';

  showDurationDropdown = false;

  durationOptions = [
    { value: 1, label: '1x', desc: 'Lunas sekaligus' },
    { value: 2, label: '2x', desc: '2 periode gaji' },
    { value: 3, label: '3x', desc: '3 periode gaji' },
    { value: 4, label: '4x', desc: '4 periode gaji' },
    { value: 5, label: '5x', desc: '5 periode gaji' }
  ];

  constructor(
    private cashAdvanceService: CashAdvanceService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.cashAdvanceService.getHistory().subscribe({
      next: (res: any) => {
        this.history = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Gagal memuat riwayat kasbon.', 'danger');
      }
    });
  }

  toggleDurationDropdown() {
    this.showDurationDropdown = !this.showDurationDropdown;
  }

  selectDuration(value: number) {
    this.duration = value;
    this.showDurationDropdown = false;
  }

  getDurationLabel(value: number): string {
    const opt = this.durationOptions.find(o => o.value === value);
    return opt ? opt.label : 'Pilih';
  }

  submitForm() {
    if (!this.amount || this.amount < 10000) {
      this.showToast('Nominal minimal Rp 10.000 dan wajib diisi.', 'warning');
      return;
    }

    if (!this.duration) {
      this.showToast('Pilih lama cicilan.', 'warning');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      amount: this.amount,
      installment_duration: this.duration,
      reason: this.reason?.trim() || ''
    };

    this.cashAdvanceService.submitRequest(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showToast('Pengajuan kasbon berhasil dikirim!', 'success');
        this.resetForm();
        this.loadHistory();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Terjadi kesalahan saat mengirim pengajuan.';
        this.showToast(msg, 'danger');
      }
    });
  }

  resetForm() {
    this.amount = null;
    this.duration = 1;
    this.reason = '';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
  }

  getStatusColor(status: string) {
    switch(status) {
      case 'pending':    return 'warning';
      case 'active':     return 'primary';
      case 'paid_off':   return 'success';
      case 'rejected':   return 'danger';
      default:           return 'medium';
    }
  }

  getStatusLabel(status: string) {
    switch(status) {
      case 'pending':    return 'Menunggu Approval';
      case 'active':     return 'Cicilan Berjalan';
      case 'paid_off':   return 'Lunas';
      case 'rejected':   return 'Ditolak';
      default:           return status;
    }
  }
}