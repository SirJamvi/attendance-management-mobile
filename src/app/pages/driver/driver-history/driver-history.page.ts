import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController } from '@ionic/angular';

import { AttendanceService } from 'src/app/services/attendance';
import { LoadingSpinnerComponent } from 'src/app/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-driver-history',
  templateUrl: './driver-history.page.html',
  styleUrls: ['./driver-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, LoadingSpinnerComponent]
})
export class DriverHistoryPage implements OnInit {

  historyData: any[] = [];
  isLoading = false;
  startDate: string = '';
  endDate: string = '';

  constructor(
    private attendanceService: AttendanceService,
    private navCtrl: NavController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    const endDateObj = new Date();
    const startDateObj = new Date();
    startDateObj.setDate(1);
    
    this.startDate = this.formatDateForInput(startDateObj);
    this.endDate = this.formatDateForInput(endDateObj);
  }

  ionViewWillEnter() {
    this.loadHistory();
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return 'Pilih tanggal';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  async openStartDatePicker() {
    const alert = await this.alertCtrl.create({
      header: 'Tanggal Mulai',
      inputs: [{ name: 'date', type: 'date', value: this.startDate }],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'OK',
          handler: (data) => {
            if (data.date) {
              this.startDate = data.date;
              if (this.endDate && this.endDate < this.startDate) {
                this.endDate = this.startDate;
              }
              this.loadHistory();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async openEndDatePicker() {
    const alert = await this.alertCtrl.create({
      header: 'Tanggal Akhir',
      inputs: [{ name: 'date', type: 'date', value: this.endDate, min: this.startDate }],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'OK',
          handler: (data) => {
            if (data.date) {
              this.endDate = data.date;
              this.loadHistory();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  loadHistory(event?: any) {
    this.isLoading = true;
    this.attendanceService.getHistory(this.startDate, this.endDate).subscribe({
      next: (response) => {
        this.historyData = response.data.data || response.data || [];
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('❌ Gagal memuat history:', err);
        this.isLoading = false;
        if (event) event.target.complete();
      }
    });
  }

  /**
   * Navigate ke detail page dengan passing data
   */
  openDetail(item: any) {
    console.log('👁️ Navigating to detail page with data:', item);
    
    this.navCtrl.navigateForward('/attendance-detail', {
      state: {
        data: item
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'late': return 'danger';
      case 'on_time': return 'success';
      case 'present': return 'success';
      default: return 'warning';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'late': return 'Terlambat';
      case 'on_time': return 'Tepat Waktu';
      case 'present': return 'Hadir';
      default: return 'Unknown';
    }
  }
}