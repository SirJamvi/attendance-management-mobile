import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonBadge, IonButton, IonIcon, IonSpinner, IonList, IonItem, IonLabel, IonNote,
  AlertController, LoadingController, ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, alertCircleOutline,
  chatbubbleEllipsesOutline, imageOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { KoDeliveryItem } from 'src/app/types/api.types';

@Component({
  selector: 'app-ko-delivery-detail',
  templateUrl: './ko-delivery-detail.page.html',
  styleUrls: ['./ko-delivery-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonBadge, IonButton, IonIcon, IonSpinner, IonList, IonItem, IonLabel, IonNote
  ]
})
export class KoDeliveryDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private koService = inject(KoOperationsService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private navCtrl = inject(NavController);

  deliveryId = 0;
  isLoading = true;
  errorMsg = '';
  item: KoDeliveryItem | null = null;

  constructor() {
    addIcons({
      checkmarkCircleOutline, closeCircleOutline, alertCircleOutline,
      chatbubbleEllipsesOutline, imageOutline
    });
  }

  ngOnInit() {
    this.deliveryId = Number(this.route.snapshot.paramMap.get('id') || 0);
    this.loadDetail();
  }

  loadDetail() {
    if (!this.deliveryId) {
      this.errorMsg = 'ID delivery tidak valid.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMsg = '';

    this.koService.getDeliveryDetail(this.deliveryId).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.item = res.data;
        } else {
          this.errorMsg = res?.message || 'Detail delivery tidak ditemukan.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Gagal memuat detail delivery.';
      }
    });
  }

  get proofImageSrc(): string | null {
    return this.item?.proof_photo_url || this.item?.proof_photo || null;
  }

  async approve() {
    if (!this.item) return;
    const loading = await this.loadingCtrl.create({ message: 'Menyetujui...' });
    await loading.present();

    this.koService.approveDelivery(this.item.id).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(res?.message || 'Delivery disetujui!', 'success');
        this.navCtrl.back();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal menyetujui.', 'danger');
      }
    });
  }

  async reject() {
    if (!this.item) return;
    const alert = await this.alertCtrl.create({
      header: 'Tolak Laporan Delivery',
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
            this.executeReject(reason);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async executeReject(reason: string) {
    if (!this.item) return;
    const loading = await this.loadingCtrl.create({ message: 'Menolak...' });
    await loading.present();

    this.koService.rejectDelivery(this.item.id, reason).subscribe({
      next: async (res) => {
        await loading.dismiss();
        await this.showToast(res?.message || 'Delivery ditolak.', 'warning');
        this.navCtrl.back();
      },
      error: async (err) => {
        await loading.dismiss();
        await this.showToast(err.error?.message || 'Gagal menolak.', 'danger');
      }
    });
  }

  getStatusColor(status: string): string {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
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
