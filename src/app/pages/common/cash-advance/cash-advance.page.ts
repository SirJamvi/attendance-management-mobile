import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CashAdvanceService } from 'src/app/services/cash-advance/cash-advance.service';
import { ToastController } from '@ionic/angular';

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

  // Variabel Form
  amount: number | null = null;
  duration: number = 1;
  reason: string = '';

  constructor(
    private cashAdvanceService: CashAdvanceService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory(event?: any) {
    if (!event && this.history.length === 0) this.isLoading = true;
    this.cashAdvanceService.getHistory().subscribe({
      next: (res: any) => {
        this.history = res.data;
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        this.isLoading = false;
        if (event) event.target.complete();
        this.showToast('Gagal memuat riwayat kasbon.', 'danger');
      }
    });
  }

  submitForm() {
    if (!this.amount || !this.duration || !this.reason) {
      this.showToast('Harap lengkapi semua isian formulir.', 'warning');
      return;
    }

    if (this.amount < 10000) {
      this.showToast('Minimal pengajuan adalah Rp 10.000', 'warning');
      return;
    }

    // ✅ Validasi batasan cicilan berdasarkan nominal
    if (this.amount < 150000 && this.duration > 1) {
      this.showToast('Pinjaman di bawah Rp 150.000 tidak bisa dicicil (Pilih 1x).', 'danger');
      return;
    }

    if (this.amount >= 150000 && this.amount < 500000 && this.duration > 3) {
      this.showToast('Pinjaman di bawah Rp 500.000 maksimal dicicil 3x.', 'danger');
      return;
    }
    // ✅ Akhir validasi cicilan

    this.isSubmitting = true;
    const data = {
      amount: this.amount,
      installment_duration: this.duration,
      reason: this.reason
    };

    this.cashAdvanceService.submitRequest(data).subscribe({
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
      duration: 2000,
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