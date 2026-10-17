import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
  imports: [ReactiveFormsModule],
  templateUrl: './auth-credentials-form.component.html',
  styleUrl: './auth-credentials-form.component.css',
})
export class AuthCredentialsFormComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  readonly mode = input<AuthFormMode>('login');
  readonly loading = input(false);
  readonly errorMessage = input('');
  readonly submitted = output<AuthCredentials>();
  readonly passwordVisible = signal(false);

  readonly submitLabel = computed(() => this.mode() === 'register' ? 'Crear cuenta' : 'Ingresar');
  readonly passwordAutocomplete = computed(() => this.mode() === 'register' ? 'new-password' : 'current-password');
  readonly form = this.formBuilder.group({
    fullName: ['', Validators.maxLength(120)],
    email: [this.rememberedEmail(), [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    rememberPassword: [Boolean(this.rememberedEmail())],
  });

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    const value = this.form.getRawValue();
    const requiresName = this.mode() === 'register' && !value.fullName.trim();

    if (this.form.invalid || requiresName) {
      this.form.markAllAsTouched();
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
