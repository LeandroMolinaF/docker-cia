import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../http/api-config.token';
import { authSignal, AuthUser } from '../state/auth.signal';

type LoginDto = { email: string; password: string };
type LoginRes = { accessToken: string; refreshToken: string; user?: AuthUser };
type RefreshRes = { accessToken: string; refreshToken?: string };

function decodeJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  async register(dto: { email: string; password: string }) {
    return firstValueFrom(this.http.post(`${this.base}/auth/register`, dto));
  }

  async login(dto: LoginDto) {
    const res = await firstValueFrom(this.http.post<LoginRes>(`${this.base}/auth/login`, dto));
    // guardar sesión
    authSignal.setSession(
      { accessToken: res.accessToken, refreshToken: res.refreshToken },
      // si backend no retorna user, lo inferimos del access token
      res.user ?? this.userFromAccess(res.accessToken)
    );
    return authSignal.user();
  }

  /** IMPORTANTE: refresh usa Authorization con el REFRESH token */
  async refresh() {
    const rt = authSignal.refreshToken();
    if (!rt) throw new Error('No refresh token');
    // Marcamos la request con un header sentinela para que el interceptor ponga el refresh token
    const headers = new HttpHeaders({ 'X-Use-Refresh-Token': 'true' });
    const res = await firstValueFrom(
      this.http.post<RefreshRes>(`${this.base}/auth/refresh`, {}, { headers })
    );
    authSignal.updateTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    return res.accessToken;
  }

  async logout() {
    try {
      // logout está protegido por JwtAuthGuard → se enviará el access token por el interceptor
      await firstValueFrom(this.http.post(`${this.base}/auth/logout`, {}));
    } catch {}
    authSignal.clear();
  }

  private userFromAccess(token: string): AuthUser {
    // adapta estas claves a tu payload JWT (ej: sub, email, role)
    const payload = decodeJwt<any>(token) || {};
    return {
      id: payload.sub ?? payload.id ?? '',
      email: payload.email ?? '',
      role: payload.role ?? 'CUSTOMER'
    };
  }
}
