import { CanMatchFn, Route, UrlSegment, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authSignal } from '../state/auth.signal';

export class RoleGuard {
  static withRoles(roles: Array<'ADMIN'|'STAFF'|'CUSTOMER'>): CanMatchFn {
    return (_route: Route, _segments: UrlSegment[]) => {
      const router = inject(Router);
      const userRole = authSignal.role();
      const isAuth = authSignal.isAuthenticated();
      if (!isAuth) {
        router.navigateByUrl('/login');
        return false;
      }
      if (!userRole || !roles.includes(userRole as any)) {
        router.navigateByUrl('/');
        return false;
      }
      return true;
    };
  }
}
