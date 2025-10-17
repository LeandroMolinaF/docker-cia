import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_BASE_URL } from './core/http/api-config.token';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/http/auth.interceptor';
import { authHeaderInterceptor } from './core/http/auth-header.interceptor';
import { provideAuthInit } from './core/init/auth.init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withInterceptors([authInterceptor, authHeaderInterceptor])),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    provideAuthInit,
  ],
};