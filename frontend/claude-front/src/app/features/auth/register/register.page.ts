import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, apply, form, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AuthService } from '../../../core/services/auth.service';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { PasswordInputComponent } from '../../../shared/components/password-input.component';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { PASSWORD_MIN, RegisterModel, registerSchema } from '../auth.schemas';

@Component({
  selector: 'app-register-page',
  imports: [AuthLayoutComponent, FormField, FieldErrorsComponent, PasswordInputComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly passwordHint = `Mínimo ${PASSWORD_MIN} caracteres.`;
  readonly model = signal<RegisterModel>({ fullName: '', email: '', password: '', confirmPassword: '' });
  readonly registerForm = form(this.model, (p) => {
    apply(p, registerSchema);
    validate(p.confirmPassword, ({ value, valueOf }) =>
      value() && value() !== valueOf(p.password)
        ? { kind: 'passwordMismatch', message: 'Las contraseñas no coinciden.' }
        : undefined,
    );
  });
  readonly serverError = signal<string | null>(null);
  readonly emailInvalid = computed(
    () => this.registerForm.email().touched() && this.registerForm.email().invalid(),
  );
  readonly nameInvalid = computed(
    () => this.registerForm.fullName().touched() && this.registerForm.fullName().invalid(),
  );

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    await submit(this.registerForm, async () => {
      const { fullName, email, password } = this.model();
      try {
        await firstValueFrom(
          this.auth.register({ fullName: fullName.trim(), email: email.trim(), password }),
        );
        this.model.update((m) => ({ ...m, password: '', confirmPassword: '' }));
        await this.router.navigateByUrl(this.auth.homeUrl());
      } catch (err) {
        this.serverError.set(errorMessage(err));
      }
      return undefined;
    });
  }
}
