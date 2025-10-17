import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authSignal } from '../state/auth.signal';

export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const isAuth = authSignal.isAuthenticated();
  if (isAuth) return true;
  router.navigateByUrl('/login');
  return false;
};
