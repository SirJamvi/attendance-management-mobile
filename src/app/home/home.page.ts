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
      .subscribe((isLoggedIn: boolean | null) => { // <-- PERBAIKAN TIPE DATA
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
   */
  redirectToDashboard() {
    const user = this.authService.getCurrentUserValue();
    
    if (user?.role.slug === 'driver') {
      console.log('Driver logged in, redirecting to /tabs/driver');
      this.router.navigate(['/tabs/driver'], { replaceUrl: true }); 
    } else if (user?.role.slug === 'sales') {
      console.log('Sales logged in, redirecting to /tabs/sales');
      this.router.navigate(['/tabs/sales'], { replaceUrl: true });
    } else {
      console.error('Unknown role, redirecting to login.');
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