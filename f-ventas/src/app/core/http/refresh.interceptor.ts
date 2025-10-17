import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthApiService } from '../services/auth-api.service';
import { catchError, switchMap, throwError, finalize, from } from 'rxjs';

let isRefreshing = false;
let waiters: Array<() => void> = [];

function onRefreshed() { waiters.forEach(cb => cb()); waiters = []; }
function waitRefresh(): Promise<void> {
  return new Promise<void>(resolve => waiters.push(resolve));
}

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthApiService);

  return next(req).pipe(
    catchError((err: any) => {
      const e = err as HttpErrorResponse;
      const is401 = e.status === 401;

      // evitar bucles con endpoints de auth
      const isAuthCall =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout');

      if (!is401 || isAuthCall) return throwError(() => err);

      if (!isRefreshing) {
        isRefreshing = true;
        return from(auth.refresh()).pipe(
          switchMap(() => {
            onRefreshed();
            return next(req.clone());
          }),
          catchError(e2 => {
            auth.logout();
            return throwError(() => e2);
          }),
          finalize(() => { isRefreshing = false; })
        );
      } else {
        return from(waitRefresh()).pipe(
          switchMap(() => next(req.clone()))
        );
      }
    })
  );
};
