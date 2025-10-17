import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginDto } from '../../core/types/auth.types';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="min-h-screen grid place-items-center bg-gray-50">
    <div class="w-full max-w-md p-8 rounded-2xl shadow bg-white">
      <h1 class="text-2xl font-semibold text-gray-800 mb-6">Iniciar sesión</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="email">Correo</label>
          <input id="email" type="email" formControlName="email"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 placeholder="tu@correo.cl" autocomplete="email" />
          <p *ngIf="emailInvalid()" class="mt-1 text-sm text-red-600">Correo inválido</p>
        </div>

        <div class="mb-2">
          <label class="block text-sm font-medium text-gray-700 mb-1" for="password">Contraseña</label>
          <input id="password" type="password" formControlName="password"
                 class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                 placeholder="••••••••" autocomplete="current-password" />
          <p *ngIf="passwordInvalid()" class="mt-1 text-sm text-red-600">Mínimo 6 caracteres</p>
        </div>

        <div class="h-6">
          <p *ngIf="errorMsg()" aria-live="assertive" class="text-sm text-red-600">{{ errorMsg() }}</p>
        </div>

        <button type="submit"
                class="mt-2 w-full rounded-lg bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                [disabled]="form.invalid || loading()">
          {{ loading() ? 'Ingresando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
  `,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private authApi = inject(AuthApiService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  emailInvalid() {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }
  passwordInvalid() {
    const c = this.form.controls.password;
    return c.touched && c.invalid;
  }

  async onSubmit() {
    this.errorMsg.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    try {
        await this.authApi.login({ email: this.form.value.email!, password: this.form.value.password! });
        this.router.navigateByUrl('/');
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'No se pudo iniciar sesión';
      this.errorMsg.set(msg);
    } finally {
      this.loading.set(false);
    }
  }
}
