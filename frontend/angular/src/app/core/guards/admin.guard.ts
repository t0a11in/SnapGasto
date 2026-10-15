import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../state/session.store';

/** Impide abrir los mantenedores sin una sesión con rol ADMIN. */
export const adminGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  return sessionStore.isAdmin() || inject(Router).createUrlTree(['/login']);
};
