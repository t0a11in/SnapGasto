import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, defer, finalize, from, of, shareReplay, tap } from 'rxjs';
import { ReauthModalComponent } from '../../features/auth/reauth-modal/reauth-modal.component';
import { SessionStore } from '../state/session.store';
import { AuthService } from './auth.service';

/**
 * Coordina la recuperación de sesión expirada (HTTP 419).
 * - Un único modal aunque fallen varias peticiones a la vez: todas esperan el mismo resultado.
 * - Si el usuario cancela o no hay usuario en sesión, se cierra la sesión.
 */
@Injectable({ providedIn: 'root' })
export class ReauthService {
  private readonly modal = inject(NgbModal);
  private readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);

  private pending$: Observable<boolean> | null = null;

  /** true mientras el modal de reautenticación está abierto. */
  get inProgress(): boolean {
    return this.pending$ !== null;
  }

  reauthenticate(): Observable<boolean> {
    if (!this.session.user()) {
      this.auth.logout();
      return of(false);
    }
    if (!this.pending$) {
      this.pending$ = defer(() => from(this.openModal())).pipe(
        tap((ok) => {
          if (!ok) {
            this.auth.logout();
          }
        }),
        finalize(() => (this.pending$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.pending$;
  }

  private openModal(): Promise<boolean> {
    const ref = this.modal.open(ReauthModalComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      ariaLabelledBy: 'reauth-title',
    });
    return ref.result.then(
      (result: unknown) => result === true,
      () => false,
    );
  }
}

