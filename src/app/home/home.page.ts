import { Component, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

// --- PERBAIKAN IMPORT ---
// (Nama file Anda adalah 'auth.ts', bukan 'auth.service.ts')
import { AuthService } from '../services/auth'; 
// -------------------------

import { LoadingSpinnerComponent } from '../components/loading-spinner/loading-spinner.component';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, LoadingSpinnerComponent],
})
export class HomePage implements OnDestroy {

  private authSubscription: Subscription | undefined;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ionViewWillEnter() {
    this.authSubscription = this.authService.getAuthState()
      .pipe(
        filter(state => state !== null), 
        take(1) 
      )
      .subscribe((isLoggedIn: boolean | null) => {
        if (isLoggedIn) {
          this.redirectToDashboard();
        } else {
          console.log('User not logged in, redirecting to /login');
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      });
  }

  /**
   * Mengarahkan user berdasarkan Role (Sesuai SOP)
   * ✅ PERBAIKAN: role adalah string langsung dari backend
   */
  redirectToDashboard() {
    const user = this.authService.getCurrentUserValue();
    
    console.log('🔍 User data:', user);
    console.log('🔍 User role:', user?.role);
    
    if (!user) {
      console.error('❌ User data tidak ada, redirecting to login.');
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    // ✅ role adalah string langsung: 'driver' atau 'sales'
    const roleSlug = user.role;
    
    console.log('🔍 Role detected:', roleSlug);
    
    // Route berdasarkan role
    if (roleSlug === 'driver') {
      console.log('✅ Driver logged in, redirecting to /tabs/driver');
      this.router.navigate(['/tabs/driver'], { replaceUrl: true }); 
    } else if (roleSlug === 'sales') {
      console.log('✅ Sales logged in, redirecting to /tabs/sales');
      this.router.navigate(['/tabs/sales'], { replaceUrl: true });
    } else {
      console.error('❌ Unknown role:', roleSlug, '- redirecting to login.');
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  // Hentikan subscription saat halaman dihancurkan
  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}