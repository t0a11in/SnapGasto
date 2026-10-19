import { HttpContext, HttpContextToken } from '@angular/common/http';

/** Si es true, un 419 no abre el modal de reautenticación. */
export const SKIP_REAUTH = new HttpContextToken<boolean>(() => false);

/** Si es true, un 401 no cierra la sesión automáticamente. */
export const SKIP_AUTO_LOGOUT = new HttpContextToken<boolean>(() => false);

/** Contexto para peticiones de sesión (login, token-status) que no deben encadenar recuperación. */
export function sessionRequestContext(): HttpContext {
  return new HttpContext().set(SKIP_REAUTH, true).set(SKIP_AUTO_LOGOUT, true);
}
