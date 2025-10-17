import { HttpInterceptorFn } from '@angular/common/http';
import { authSignal } from '../state/auth.signal';

export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  // si la request pidió explícitamente usar refresh token:
  const useRefresh = req.headers.get('X-Use-Refresh-Token') === 'true';
  if (useRefresh) {
    const refresh = authSignal.refreshToken();
    req = req.clone({
      setHeaders: {
        Authorization: refresh ? `Bearer ${refresh}` : '',
      },
      headers: req.headers.delete('X-Use-Refresh-Token'),
    });
    return next(req);
  }

  // por defecto, usa access token
  const access = authSignal.accessToken();
  if (access && !req.headers.has('Authorization')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${access}` } });
  }
  return next(req);
};
