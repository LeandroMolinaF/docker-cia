import { inject, signal, computed } from '@angular/core';
import type { User } from '../types/auth.types';

class AuthStore {
  accessToken = signal<string | null>(null);
  refreshToken = signal<string | null>(null);
  user = signal<User | null>(null);

  isAuthenticated = computed(() => !!this.accessToken() && !!this.user());
  role = computed(() => this.user()?.role ?? null);

  setSession(user: User, access: string, refresh: string) {
    console.log(user, access, refresh)
    this.user.set(user);
    this.accessToken.set(access);
    this.refreshToken.set(refresh);
  }

  clear() {
    this.user.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);
  }
}

export const authSignal = new AuthStore();
