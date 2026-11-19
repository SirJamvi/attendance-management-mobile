import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
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
    this.authSubscription = this.authService
      .getAuthState()
      .pipe(
        filter((state) => state !== null),
        take(1)
      )
      .subscribe((isLoggedIn: boolean | null) => {
        if (isLoggedIn) {
          this.redirectToDashboard();
        } else {
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      });
  }

  redirectToDashboard() {
    const user = this.authService.getCurrentUserValue();

    if (!user) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    const targetRoute = this.authService.getDefaultRouteForRole(user.role);
    this.router.navigate([targetRoute], { replaceUrl: true });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
