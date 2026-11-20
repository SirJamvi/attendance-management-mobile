import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonNote, IonIcon, IonText, IonRefresher, IonRefresherContent,
  IonBadge, IonSpinner, IonList, IonItemDivider, IonButton, IonProgressBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline, timeOutline, warningOutline, calendarOutline,
  cashOutline, alertCircleOutline, trophyOutline, cubeOutline,
  checkmarkDoneOutline, flameOutline, medalOutline, ribbonOutline,
  peopleOutline, sparklesOutline
} from 'ionicons/icons';
import { SalaryService, SalaryData } from 'src/app/services/salary.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';

@Component({
  selector: 'app-driver-salary',
  templateUrl: './driver-salary.page.html',
  styleUrls: ['./driver-salary.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonNote, IonIcon, IonText, IonRefresher, IonRefresherContent,
    IonBadge, IonSpinner, IonList, IonItemDivider, IonButton, IonProgressBar
  ]
})
export class DriverSalaryPage implements OnInit {
  private salaryService = inject(SalaryService);
  private router = inject(Router);

  salaryData: SalaryData | null = null;
  isLoading = true;
  errorMsg = '';

  constructor() {
    addIcons({
      walletOutline, timeOutline, warningOutline, calendarOutline,
      cashOutline, alertCircleOutline, trophyOutline, cubeOutline,
      checkmarkDoneOutline, flameOutline, medalOutline, ribbonOutline,
      peopleOutline, sparklesOutline
    });
  }

  ngOnInit() {
    this.loadSalary();
  }

  ionViewWillEnter() {
    this.loadSalary();
  }

  loadSalary(event?: any) {
    if (!event && !this.salaryData) this.isLoading = true;
    this.errorMsg = '';

    this.salaryService.getDriverSalary().subscribe({
      next: (res) => {
        if (res.success) {
          this.salaryData = res.data;
        } else {
          this.errorMsg = res.message || 'Gagal memuat data gaji.';
        }

        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        if (err.status === 0) {
          this.errorMsg = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
        } else if (err.status === 401) {
          this.errorMsg = 'Sesi Anda telah berakhir. Silakan login kembali.';
        } else if (err.status === 404) {
          this.errorMsg = 'Data tidak ditemukan (404).';
        } else if (err.status === 500) {
          this.errorMsg = 'Terjadi kesalahan pada server (500).';
        } else {
          this.errorMsg = err.error?.message || 'Terjadi kesalahan saat memuat data.';
        }

        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  get deliveryKpiProgress(): number {
    const pct = this.salaryData?.delivery_kpi?.target_achievement_percent || 0;
    return Math.min(1, Math.max(0, pct / 100));
  }

  get inspectionKpiProgress(): number {
    const pct = this.salaryData?.inspection_kpi?.target_achievement_percent || 0;
    return Math.min(1, Math.max(0, pct / 100));
  }

  get driverKpiProgress(): number {
    const pct = this.salaryData?.kpi_summary?.total_score || 0;
    return Math.min(1, Math.max(0, pct / 100));
  }

  getGradeColor(grade?: string): string {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'primary';
      case 'C': return 'warning';
      default: return 'danger';
    }
  }

  doRefresh(event: any) {
    this.loadSalary(event);
  }
}
