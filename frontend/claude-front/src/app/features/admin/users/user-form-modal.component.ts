import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, email, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AdminUserRequest, AdminUserResponse, Role } from '../../../core/models';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { PasswordInputComponent } from '../../../shared/components/password-input.component';
import { AdminResourceStore } from '../shared/admin-resource.store';

interface UserFormModel {
  fullName: string;
  email: string;
  role: Role;
  password: string;
}

@Component({
  selector: 'app-user-form-modal',
  imports: [FormField, FieldErrorsComponent, PasswordInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-modal.component.html',
})
export class UserFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private store: AdminResourceStore<AdminUserRequest, AdminUserResponse> | null = null;

  readonly editingId = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  readonly model = signal<UserFormModel>({ fullName: '', email: '', role: 'USER', password: '' });
  readonly userForm = form(this.model, (p) => {
    required(p.fullName, { message: 'Ingresa el nombre.' });
    maxLength(p.fullName, 120, { message: 'Máximo 120 caracteres.' });
    required(p.email, { message: 'Ingresa el correo.' });
    email(p.email, { message: 'Ingresa un correo válido.' });
    required(p.role);
    validate(p.password, ({ value }) => {
      const v = value();
      if (!v) {
        return this.editingId() ? undefined : { kind: 'required', message: 'Ingresa una contraseña.' };
      }
      return v.length < 8 ? { kind: 'minLength', message: 'Mínimo 8 caracteres.' } : undefined;
    });
  });

  configure(store: AdminResourceStore<AdminUserRequest, AdminUserResponse>, user: AdminUserResponse | null): void {
    this.store = store;
    this.editingId.set(user?.id ?? null);
    this.model.set(
      user
        ? { fullName: user.fullName, email: user.email, role: user.role, password: '' }
        : { fullName: '', email: '', role: 'USER', password: '' },
    );
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    const store = this.store;
    if (!store) {
      return;
    }
    await submit(this.userForm, async () => {
      const m = this.model();
      const body: AdminUserRequest = { fullName: m.fullName.trim(), email: m.email.trim(), role: m.role };
      if (m.password) {
        body.password = m.password;
      }
      try {
        await firstValueFrom(store.save(this.editingId(), body));
        this.model.update((x) => ({ ...x, password: '' }));
        this.activeModal.close(true);
      } catch (err) {
        this.serverError.set(errorMessage(err));
      }
      return undefined;
    });
  }
}
