import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../state/session.store';

/** Exige una sesión válida para los módulos personales de SnapGasto. */
export const authGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  return sessionStore.session() ? true : inject(Router).createUrlTree(['/login']);
};
