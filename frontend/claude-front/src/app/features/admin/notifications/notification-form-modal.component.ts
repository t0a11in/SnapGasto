import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AdminUserResponse, NotificationRequest, NotificationResponse } from '../../../core/models';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { AdminResourceStore } from '../shared/admin-resource.store';

@Component({
  selector: 'app-notification-form-modal',
  imports: [FormField, FieldErrorsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-form-modal.component.html',
})
export class NotificationFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private store: AdminResourceStore<NotificationRequest, NotificationResponse> | null = null;

  readonly editingId = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  readonly users = signal<readonly AdminUserResponse[]>([]);
  readonly model = signal<NotificationRequest>({ userId: '', title: '', body: '', read: false });
  readonly notificationForm = form(this.model, (p) => {
    required(p.userId, { message: 'Selecciona el destinatario.' });
    required(p.title, { message: 'Ingresa un título.' });
    maxLength(p.title, 140, { message: 'Máximo 140 caracteres.' });
    required(p.body, { message: 'Ingresa el mensaje.' });
    maxLength(p.body, 1000, { message: 'Máximo 1000 caracteres.' });
  });

  configure(
    store: AdminResourceStore<NotificationRequest, NotificationResponse>,
    users: readonly AdminUserResponse[],
    n: NotificationResponse | null,
  ): void {
    this.store = store;
    this.users.set([...users].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    this.editingId.set(n?.id ?? null);
    this.model.set(
      n ? { userId: n.userId, title: n.title, body: n.body, read: n.read } : { userId: '', title: '', body: '', read: false },
    );
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    const store = this.store;
    if (!store) {
      return;
    }
    await submit(this.notificationForm, async () => {
      const m = this.model();
      try {
        await firstValueFrom(
          store.save(this.editingId(), { userId: m.userId, title: m.title.trim(), body: m.body.trim(), read: m.read }),
        );
        this.activeModal.close(true);
      } catch (err) {
        this.serverError.set(errorMessage(err));
      }
      return undefined;
    });
  }
}
