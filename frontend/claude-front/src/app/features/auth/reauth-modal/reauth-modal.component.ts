import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, required, submit } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AuthService } from '../../../core/services/auth.service';
import { SessionStore } from '../../../core/state/session.store';
import { PasswordInputComponent } from '../../../shared/components/password-input/password-input.component';

/**
 * Modal de sesión expirada (HTTP 419). Pide solo la contraseña; el correo sale de
 * la sesión. Cierra con `true` al reautenticar o `dismiss` al cancelar.
 */
@Component({
  selector: 'app-reauth-modal',
  imports: [PasswordInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reauth-modal.component.html',
})
export class ReauthModalComponent {
  private readonly activeModal = inject(NgbActiveModal);
  private readonly auth = inject(AuthService);

  readonly email = inject(SessionStore).user()?.email ?? '';
  readonly model = signal({ password: '' });
  readonly reauthForm = form(this.model, (p) => {
    required(p.password, { message: 'Ingresa tu contraseña.' });
  });
  readonly serverError = signal<string | null>(null);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    await submit(this.reauthForm, async () => {
      try {
        await firstValueFrom(this.auth.reauthenticate(this.model().password));
        this.model.set({ password: '' });
        this.activeModal.close(true);
      } catch (err) {
        this.serverError.set(errorMessage(err));
      }
      return undefined;
    });
  }

  cancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
