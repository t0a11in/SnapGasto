import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppStore } from '../state/App.store';
import { SessionStore } from '../state/session.store';
import { ReauthenticateModalComponent } from '../../shared/components/reauthenticate-modal/reauthenticate-modal.component';

/** Reinicia una sesión expirada y solicita credenciales nuevas en la pantalla de login. */
@Injectable({ providedIn: 'root' })
export class SessionRecoveryService {
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);
  private readonly appStore = inject(AppStore);
  private readonly modal = inject(NgbModal);
  private reauthenticationOpen = false;

  requestNewToken(): void {
    if (this.reauthenticationOpen) {
      return;
    }

    this.reauthenticationOpen = true;
    this.appStore.setTokenLife('CLOSED');
    const modalRef = this.modal.open(ReauthenticateModalComponent, {
      backdrop: 'static',
      centered: true,
      keyboard: false,
    });

    void modalRef.result.then(
      () => this.reauthenticationOpen = false,
      () => this.returnToLogin(),
    );
  }

  private returnToLogin(): void {
    this.reauthenticationOpen = false;
    const returnUrl = this.router.url === '/login' ? undefined : this.router.url;

    this.sessionStore.clear();
    this.appStore.setTokenLife('CLOSED');
    void this.router.navigate(['/login'], { queryParams: { returnUrl } });
  }
}
