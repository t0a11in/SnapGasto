import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, form, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { toAppHttpError } from '../../../core/http/error.utils';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../shared/services/alert.service';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { PasswordInputComponent } from '../../../shared/components/password-input.component';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { LoginModel, loginSchema } from '../auth.schemas';

@Component({
  selector: 'app-login-page',
  imports: [AuthLayoutComponent, FormField, FieldErrorsComponent, PasswordInputComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alerts = inject(AlertService);

  private readonly remembered = this.auth.rememberedEmail();

  readonly model = signal<LoginModel>({
    email: this.remembered ?? '',
    password: '',
    rememberEmail: this.remembered !== null,
  });
  readonly loginForm = form(this.model, loginSchema);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.loginForm, async () => {
      const { email, password, rememberEmail } = this.model();
      try {
        await firstValueFrom(this.auth.login({ email: email.trim(), password }, rememberEmail));
        // La contraseña no se conserva en memoria más allá del envío.
        this.model.update((m) => ({ ...m, password: '' }));
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        await this.router.navigateByUrl(
          returnUrl && returnUrl.startsWith('/') ? returnUrl : this.auth.homeUrl(),
        );
      } catch (err) {
        void this.showLoginError(err);
      }
      return undefined;
    });
  }

  /** Credenciales inválidas → SweetAlert superior de 10 s. */
  private showLoginError(err: unknown): Promise<void> {
    const error = toAppHttpError(err);
    const badCredentials = [400, 401, 403, 404].includes(error.status);
    return this.alerts.error(
      badCredentials ? 'Correo o contraseña incorrectos' : 'No fue posible iniciar sesión',
      badCredentials ? undefined : error.message,
    );
  }
}
