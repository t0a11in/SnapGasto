import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../state/session.store';

/** Requiere sesión; si no existe redirige a /login conservando la URL solicitada. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  if (session.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Requiere rol ADMIN; un USER autenticado vuelve a su inicio. */
export const adminGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  const router = inject(Router);
  if (!session.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return session.isAdmin() ? true : router.createUrlTree(['/incomes']);
};

/** Login y registro solo para visitantes: con sesión se redirige al inicio. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/incomes']) : true;
};
