import { Component, computed, input, output, signal } from '@angular/core';
import { email, form, FormField, maxLength, minLength, required } from '@angular/forms/signals';

export type AuthFormMode = 'login' | 'register';

export interface AuthCredentials {
  email: string;
  password: string;
  fullName: string;
  rememberPassword: boolean;
}

const REMEMBERED_EMAIL_KEY = 'snapgasto.auth.remembered-email';

@Component({
  selector: 'app-auth-credentials-form',
  imports: [FormField],
  templateUrl: './auth-credentials-form.component.html',
  styleUrl: './auth-credentials-form.component.css',
})
export class AuthCredentialsFormComponent {
  readonly mode = input<AuthFormMode>('login');
  readonly loading = input(false);
  readonly errorMessage = input('');
  readonly submitted = output<AuthCredentials>();
  readonly passwordVisible = signal(false);

  readonly submitLabel = computed(() => this.mode() === 'register' ? 'Crear cuenta' : 'Ingresar');
  readonly passwordAutocomplete = computed(() => this.mode() === 'register' ? 'new-password' : 'current-password');
  readonly credentials = signal<AuthCredentials>({
    fullName: '',
    email: this.rememberedEmail(),
    password: '',
    rememberPassword: Boolean(this.rememberedEmail()),
  });
  readonly credentialsForm = form(this.credentials, (schemaPath) => {
    maxLength(schemaPath.fullName, 120, { message: 'El nombre puede tener hasta 120 caracteres.' });
    required(schemaPath.fullName, {
      when: () => this.mode() === 'register',
      message: 'Ingresa tu nombre completo.',
    });
    required(schemaPath.email, { message: 'Ingresa tu correo electrónico.' });
    email(schemaPath.email, { message: 'Ingresa un correo electrónico válido.' });
    required(schemaPath.password, { message: 'Ingresa tu contraseña.' });
    minLength(schemaPath.password, 8, { message: 'La contraseña debe tener entre 8 y 100 caracteres.' });
    maxLength(schemaPath.password, 100, { message: 'La contraseña debe tener entre 8 y 100 caracteres.' });
  });
  readonly fullNameRequired = computed(() => this.mode() === 'register' && !this.credentials().fullName.trim());
  readonly canSubmit = computed(() => this.credentialsForm().valid() && !this.fullNameRequired());

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    const value = this.credentials();

    if (!this.canSubmit()) {
      this.credentialsForm.fullName().markAsTouched();
      this.credentialsForm.email().markAsTouched();
      this.credentialsForm.password().markAsTouched();
      return;
    }

    this.rememberEmail(value.email, value.rememberPassword);
    this.submitted.emit({
      fullName: value.fullName.trim(),
      email: value.email.trim(),
      password: value.password,
      rememberPassword: value.rememberPassword,
    });
  }

  private rememberedEmail(): string {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  }

  private rememberEmail(email: string, rememberPassword: boolean): void {
    if (rememberPassword) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      return;
    }

    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }
}
