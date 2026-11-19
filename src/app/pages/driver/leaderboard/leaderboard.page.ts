import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
// ✅ PERBAIKAN 1: Path diubah sesuai dengan nama file yang benar (delivery.ts)
import { DeliveryService } from 'src/app/services/delivery';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class LeaderboardPage implements OnInit {
  private deliveryService = inject(DeliveryService);
  
  isLoading = true;
  leaderboardData: any = null;
  standings: any[] = [];
  errorMessage = '';

  constructor() {}

  ngOnInit() {
    this.fetchLeaderboard();
  }

  // Fungsi untuk hit API
  fetchLeaderboard() {
    if (!this.leaderboardData) this.isLoading = true;
    this.errorMessage = '';

    this.deliveryService.getLeaderboard().subscribe({
      // ✅ PERBAIKAN 2: Menambahkan ': any' agar TypeScript Strict Mode tidak error
      next: (res: any) => {
        if (res.status === 'success') {
          this.leaderboardData = res.data;
          this.standings = res.data.standings;
        } else {
          this.errorMessage = res.message || 'Terjadi kesalahan.';
        }
        this.isLoading = false;
      },
      // ✅ PERBAIKAN 3: Menambahkan ': any' pada err
      error: (err: any) => {
        console.error('Error fetch leaderboard:', err);
        this.errorMessage = 'Gagal memuat data klasemen. Cek koneksi Anda.';
        this.isLoading = false;
      }
    });
  }
  
  // Fungsi untuk Tarik-ke-bawah (Pull to Refresh)
  doRefresh(event: any) {
    this.fetchLeaderboard();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}