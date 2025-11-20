import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';

// --- PERBAIKAN: Impor dari 'auth.ts' (bukan 'auth.service.ts') ---
import { AuthService } from '../services/auth'; 

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    // 1. Kita filter, kita hanya mau status yang BUKAN null
    // Ini untuk menunggu AuthService selesai mengecek token (loadToken())
    filter(state => state !== null), 
    
    // 2. Kita hanya perlu 1 nilai saja (true atau false)
    take(1), 
    
    // 3. Kita cek nilainya
    map(isLoggedIn => {
      if (isLoggedIn === true) {
        return true; // <-- Pengguna sudah login, izinkan masuk
      }
      
      // --- Pengguna tidak login ---
      console.warn('AuthGuard: Pengguna tidak terautentikasi. Mengarahkan ke /login');
      // 4. Alihkan ke halaman login dan blokir navigasi
      return router.createUrlTree(['/login']);
    })
  );
};