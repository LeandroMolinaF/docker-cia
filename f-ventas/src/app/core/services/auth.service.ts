import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from '../http/api-config.token';
import { AuthResponse, LoginDto } from '../types/auth.types';
import { authSignal } from '../state/auth.signal';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);

  async login(dto: LoginDto) {
    const res = await firstValueFrom(this.http.post<AuthResponse>(`${this.base}/auth/login`, dto));
    authSignal.setSession(res.user, res.accessToken, res.refreshToken);
    return res.user;
  }

  async refresh(): Promise<string> {
    const refresh = authSignal.refreshToken();
    if (!refresh) throw new Error('No refresh token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${refresh}`);
    const res = await firstValueFrom(this.http.post<{ accessToken: string }>(`${this.base}/auth/refresh`, {}, { headers }));
    authSignal.accessToken.set(res.accessToken);
    return res.accessToken;
  }

  logout() {
    authSignal.clear();
    this.http.post(`${this.base}/v1/auth/logout`, {}).subscribe({ error: () => {} });
  }
}
