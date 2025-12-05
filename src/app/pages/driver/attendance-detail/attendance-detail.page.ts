import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { addIcons } from 'ionicons'; // Tambahkan ini
import { 
  logInOutline, 
  logOutOutline, 
  timeOutline, 
  location, 
  imageOutline, 
  alertCircleOutline 
} from 'ionicons/icons'; // Import icon manual

@Component({
  selector: 'app-attendance-detail',
  templateUrl: './attendance-detail.page.html',
  styleUrls: ['./attendance-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AttendanceDetailPage implements OnInit {

  attendanceData: any = null;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController
  ) { 
    // ✅ REGISTRASI ICON (Wajib di Ionic Standalone untuk mencegah warning log)
    addIcons({ 
      logInOutline, 
      logOutOutline, 
      timeOutline, 
      location, 
      imageOutline, 
      alertCircleOutline 
    });
  }

  ngOnInit() {
    const navigation = history.state;
    if (navigation && navigation.data) {
      this.attendanceData = navigation.data;
      console.log('✅ Data Check In Photo Path:', this.attendanceData.check_in_photo);
    } else {
      console.error('❌ No data received, going back');
      this.goBack();
    }
  }

  goBack() {
    this.navCtrl.back();
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

  /**
   * ✅ PERBAIKAN UTAMA: URL Builder yang Aman
   */
  getImageUrl(photoPath: string): string {
    if (!photoPath) return 'assets/images/no-image.png';
    if (photoPath.startsWith('http')) return photoPath; // Sudah full URL

    try {
      // 1. Ambil API URL (https://attendance.eskristalkarawang.com/api/v1)
      const apiUrl = environment.apiUrl;
      
      // 2. Ambil Domain utamanya saja (https://attendance.eskristalkarawang.com)
      // Menggunakan `new URL().origin` jauh lebih aman daripada replace string manual
      const domainUrl = new URL(apiUrl).origin;

      // 3. Bersihkan path (hilangkan slash di depan jika ada)
      const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;

      // 4. Gabungkan: Domain + /storage/ + Path
      const finalUrl = `${domainUrl}/storage/${cleanPath}`;
      
      // Debugging (Hanya muncul sekali di log saat load)
      // console.log('🖼️ Generated Image URL:', finalUrl);
      
      return finalUrl;

    } catch (e) {
      console.error('❌ Error constructing URL:', e);
      return 'assets/images/no-image.png';
    }
  }

  /**
   * ✅ PERBAIKAN UTAMA: Mencegah Infinite Loop Spam
   */
  handleImgError(event: any) {
    // Cek apakah src sudah no-image? Jika iya, stop.
    if (event.target.src.includes('assets/images/no-image.png')) {
        return;
    }

    console.warn('⚠️ Gagal memuat gambar asli, load fallback.');
    
    // Matikan error handler untuk elemen ini agar tidak loop
    event.target.onerror = null; 
    
    // Ganti source ke fallback
    event.target.src = 'assets/images/no-image.png';
  }
}