import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionStore } from '../../core/state/session.store';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authApi = inject(AuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  readonly registerMode = signal(false);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  toggleMode(): void {
    this.registerMode.update((enabled) => !enabled);
    this.message.set('');
    this.form.controls.fullName.reset('');
  }

  submit(): void {
    if (this.form.invalid || (this.registerMode() && !this.form.controls.fullName.value.trim())) {
      this.form.markAllAsTouched();
      this.message.set('Completa los datos solicitados para continuar.');
      this.isError.set(true);
      return;
    }

    const value = this.form.getRawValue();
    this.loading.set(true);
    this.message.set('');
    const request = this.registerMode()
      ? this.authApi.register({ fullName: value.fullName.trim(), email: value.email.trim(), password: value.password })
      : this.authApi.login({ email: value.email.trim(), password: value.password });

    request.subscribe({
      next: (session) => {
        if (session.user.role !== 'ADMIN') {
          this.sessionStore.clear();
          this.isError.set(false);
          this.message.set(
            this.registerMode()
              ? 'Cuenta creada. Configura APP_BOOTSTRAP_ADMIN_EMAIL con este correo y reinicia la API para asignarle rol ADMIN.'
              : 'Esta cuenta no tiene permisos ADMIN para acceder a los mantenedores.'
          );
          return;
        }
        void this.router.navigateByUrl('/admin');
      },
      error: (error: Error) => {
        this.isError.set(true);
        this.message.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
