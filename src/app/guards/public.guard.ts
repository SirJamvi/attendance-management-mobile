import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const publicGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    filter((authState) => authState !== null),
    take(1),
    map((isLoggedIn) => {
      if (isLoggedIn === false) {
        return true;
      }

      const currentUser = authService.getCurrentUserValue();
      const target = authService.getDefaultRouteForRole(currentUser?.role);
      return router.createUrlTree([target === '/login' ? '/tabs' : target]);
    })
  );
};
