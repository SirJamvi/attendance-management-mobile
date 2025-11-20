import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const publicGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    // 1. Tunggu sampai status auth BUKAN null
    filter(authState => authState !== null),
    take(1),
    map(isLoggedIn => {
      if (isLoggedIn === false) {
        return true; // Pengguna BELUM login, izinkan masuk ke /login
      }

      // Pengguna SUDAH login
      console.warn('PublicGuard: Pengguna sudah login. Mengarahkan ke halaman utama.');
      
      // 2. Alihkan ke halaman yang sesuai (Driver atau Sales)
      const currentUser = authService.getCurrentUserValue();

      if (currentUser?.role.slug === 'driver') {
        return router.createUrlTree(['/tabs/driver']);
      } else if (currentUser?.role.slug === 'sales') {
        return router.createUrlTree(['/tabs/sales']);
      } else {
        // Fallback
        return router.createUrlTree(['/tabs']);
      }
    })
  );
};