import { APP_INITIALIZER, Provider } from '@angular/core';
import { authSignal } from '../state/auth.signal';

export function initAuthFactory() {
  return () => {
    // No hacemos nada extra: authSignal ya leyó localStorage al importarse.
    // Si quieres, podrías validar expiración aquí decodificando el access token.
  };
}

export const provideAuthInit: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initAuthFactory,
  deps: [], // sin inject
  multi: true,
};
