import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { authSignal } from '../state/auth.signal';

export const GuestGuard: CanMatchFn = (): boolean | UrlTree => {
  if (authSignal.isAuthenticated()) {
    return inject(Router).createUrlTree(['/']);
  }
  return true;
};
