import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonBadge, IonSelect, IonSelectOption,
  IonSpinner, IonIcon, IonRefresher, IonRefresherContent, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { KoOperationsService } from 'src/app/services/ko-operations.service';
import { BranchBadgeComponent } from 'src/app/components/branch-badge/branch-badge.component';

@Component({
  selector: 'app-ko-checksheet-history',
  templateUrl: './ko-checksheet-history.page.html',
  styleUrls: ['./ko-checksheet-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchBadgeComponent,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonBadge, IonSelect, IonSelectOption,
    IonSpinner, IonIcon, IonRefresher, IonRefresherContent, IonButton
  ]
})
export class KoChecksheetHistoryPage implements OnInit {
  private koService = inject(KoOperationsService);

  filterDate = '';
  filterStatus = '';

  isLoading = true;
  errorMsg = '';
  items: any[] = [];

  constructor() {
    addIcons({ calendarOutline, timeOutline, alertCircleOutline, checkmarkCircleOutline });
  }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory(event?: any) {
    if (!event) this.isLoading = true;
    this.errorMsg = '';

    this.koService
      .getChecksheetHistory({
        date: this.filterDate || undefined,
        status: this.filterStatus || undefined,
      })
      .subscribe({
        next: (res) => {
          const data = res?.data;
          if (Array.isArray(data)) {
            this.items = data;
          } else if (Array.isArray(data?.data)) {
            this.items = data.data;
          } else if (Array.isArray(data?.submissions)) {
            this.items = data.submissions;
          } else {
            this.items = [];
          }
          this.isLoading = false;
          if (event) event.target.complete();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMsg = err.error?.message || 'Gagal memuat riwayat checksheet.';
          if (event) event.target.complete();
        }
      });
  }

  resetFilters() {
    this.filterDate = '';
    this.filterStatus = '';
    this.loadHistory();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'done':
      case 'on_time':
        return 'success';
      case 'late':
        return 'warning';
      case 'missed':
      case 'needs_owner_review':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'done':
        return 'Selesai';
      case 'on_time':
        return 'Tepat Waktu';
      case 'late':
        return 'Terlambat';
      case 'missed':
        return 'Terlewat';
      case 'needs_owner_review':
        return 'Review Owner';
      default:
        return status || '-';
    }
  }

  doRefresh(event: any) {
    this.loadHistory(event);
  }
}
