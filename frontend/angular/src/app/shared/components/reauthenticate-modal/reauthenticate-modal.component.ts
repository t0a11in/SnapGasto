import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AuthCredentials, AuthCredentialsFormComponent } from '../auth-credentials-form/auth-credentials-form.component';

@Component({
  selector: 'app-reauthenticate-modal',
  imports: [AuthCredentialsFormComponent],
  templateUrl: './reauthenticate-modal.component.html',
})
export class ReauthenticateModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private readonly authApi = inject(AuthApiService);

  readonly loading = signal(false);
  readonly message = signal('');

  authenticate(credentials: AuthCredentials): void {
    this.loading.set(true);
    this.message.set('');

    this.authApi.login({ email: credentials.email, password: credentials.password }).subscribe({
      next: (session) => this.activeModal.close(session),
      error: (error: Error) => {
        this.message.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  cancel(): void {
    this.activeModal.dismiss();
  }
}
