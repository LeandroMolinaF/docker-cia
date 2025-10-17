//import { inject, signal, computed } from '@angular/core';
//import type { User } from '../types/auth.types';

//class AuthStore {
//  accessToken = signal<string | null>(null);
//  refreshToken = signal<string | null>(null);
//  user = signal<User | null>(null);
//
//  isAuthenticated = computed(() => !!this.accessToken() && !!this.user());
//  role = computed(() => this.user()?.role ?? null);
//
//  setSession(user: User, access: string, refresh: string) {
//    console.log(user, access, refresh)
//    this.user.set(user);
//    this.accessToken.set(access);
//    this.refreshToken.set(refresh);
//  }

//  clear() {
//    this.user.set(null);
//    this.accessToken.set(null);
//    this.refreshToken.set(null);
//  }
//}

//export const authSignal = new AuthStore();

import { signal } from '@angular/core';

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
}

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

const storeKey = 'app.session.v1';

function readStorage(): SessionState {
  try { return JSON.parse(localStorage.getItem(storeKey) || 'null') || { accessToken:null, refreshToken:null, user:null }; }
  catch { return { accessToken:null, refreshToken:null, user:null }; }
}
function writeStorage(s: SessionState) { localStorage.setItem(storeKey, JSON.stringify(s)); }
function clearStorage() { localStorage.removeItem(storeKey); }

const initial = readStorage();

export const authSignal = {
  accessToken: signal<string | null>(initial.accessToken),
  refreshToken: signal<string | null>(initial.refreshToken),
  user: signal<AuthUser | null>(initial.user),

  setSession(tokens: { accessToken: string; refreshToken: string }, user: AuthUser) {
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
    this.user.set(user);
    writeStorage({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
  },

  updateTokens(tokens: { accessToken: string; refreshToken?: string }) {
    const next = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? this.refreshToken(),
      user: this.user()
    };
    this.accessToken.set(next.accessToken);
    this.refreshToken.set(next.refreshToken);
    writeStorage(next as SessionState);
  },

  isAuthenticated() { return !!this.accessToken(); },
  role() { return this.user()?.role || null; },

  clear() {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    clearStorage();
  },
};
