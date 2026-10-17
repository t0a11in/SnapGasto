import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthCredentials, AuthCredentialsFormComponent } from '../../shared/components/auth-credentials-form/auth-credentials-form.component';

@Component({
  selector: 'app-login-page',
  imports: [AuthCredentialsFormComponent],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly registerMode = signal(false);
  readonly loading = signal(false);
  readonly message = signal('');

  toggleMode(): void {
    this.registerMode.update((enabled) => !enabled);
    this.message.set('');
  }

  authenticate(credentials: AuthCredentials): void {
    this.loading.set(true);
    this.message.set('');

    const request = this.registerMode()
      ? this.authApi.register({
          fullName: credentials.fullName,
          email: credentials.email,
          password: credentials.password,
        })
      : this.authApi.login({ email: credentials.email, password: credentials.password });

    request.subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (error: Error) => {
        this.message.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private returnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/admin/incomes';
  }
}
