import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonProgressBar, IonIcon, IonSpinner, IonRefresher, IonRefresherContent, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, checkmarkDoneOutline, walletOutline, calendarOutline, alertCircleOutline
} from 'ionicons/icons';

import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';
import { KoKpiSummary } from 'src/app/types/api.types';

@Component({
  selector: 'app-ko-kpi',
  templateUrl: './ko-kpi.page.html',
  styleUrls: ['./ko-kpi.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonProgressBar, IonIcon, IonSpinner, IonRefresher, IonRefresherContent, IonBadge
  ]
})
export class KoKpiPage implements OnInit {
  private koService = inject(KoOperationsService);

  selectedMonth = this.getCurrentMonthString();
  isLoading = true;
  errorMsg = '';
  summary: KoKpiSummary | null = null;

  readonly MAX_TOTAL_KPI = 100000;
  readonly MAX_COMPONENT_A = 50000;
  readonly MAX_COMPONENT_B = 50000;

  constructor() {
    addIcons({ trophyOutline, checkmarkDoneOutline, walletOutline, calendarOutline, alertCircleOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadKpi();
  }

  private getCurrentMonthString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  loadKpi(event?: any) {
    if (!event && !this.summary) this.isLoading = true;
    this.errorMsg = '';

    this.koService.getKpiSummary(this.selectedMonth).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.summary = res.data;
        } else {
          this.errorMsg = res?.message || 'Gagal memuat ringkasan KPI.';
        }
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message || 'Gagal memuat estimasi KPI.';
        if (event) event.target.complete();
      }
    });
  }

  get totalBonusProgress(): number {
    const max = this.summary?.max_kpi_bonus || this.MAX_TOTAL_KPI;
    return Math.min(1, Math.max(0, (this.summary?.total_kpi_bonus || 0) / max));
  }

  get compAProgress(): number {
    const max = this.summary?.max_component_a || this.MAX_COMPONENT_A;
    return Math.min(1, Math.max(0, (this.summary?.component_a_bonus || 0) / max));
  }

  get compBProgress(): number {
    const max = this.summary?.max_component_b || this.MAX_COMPONENT_B;
    return Math.min(1, Math.max(0, (this.summary?.component_b_bonus || 0) / max));
  }

  doRefresh(event: any) {
    this.loadKpi(event);
  }
}
