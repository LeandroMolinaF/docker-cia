import { HttpInterceptorFn } from '@angular/common/http';
import { authSignal } from '../state/auth.signal';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authSignal.accessToken();
  const isAuthRoute = /\/auth\/(login|refresh)/.test(req.url);
  if (!token || isAuthRoute) return next(req);
  const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(authReq);
};
