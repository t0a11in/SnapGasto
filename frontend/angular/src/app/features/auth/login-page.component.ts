import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionStore } from '../../core/state/session.store';
import { LoginPayload } from '../../core/models/api.models';
import { email, form, FormField, maxLength, minLength, required } from '@angular/forms/signals';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, FormField],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly authApi = inject(AuthApiService);
  private readonly sessionStore = inject(SessionStore);
  private readonly router = inject(Router);

  readonly registerMode = signal(false);
  readonly loading = signal(false);
  readonly logginBloq = signal(true);
  readonly message = signal('');
  readonly isError = signal(false);
  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.maxLength(120)]],
    email: ['test@uno.cl', [Validators.required, Validators.email]],
    password: ['Cuatico1234*', [Validators.required, Validators.minLength(8)]]
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
    this.crearActualizar();
  }

  onSubmit(event: Event) {
    event.preventDefault();

    // Perform login logic here
    const credentials = this.loginModel();
    console.log('Logging in with:', credentials);
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.message.set('');
    this.crearActualizar();
  }
  crearActualizar(){
    
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.message.set('');
    const request = this.registerMode()
      ? this.authApi.register({ fullName: value.fullName.trim(), email: value.email.trim(), password: value.password })
      : this.authApi.login({ email: value.email.trim(), password: value.password });

    request.subscribe({
      next: () => {
        void this.router.navigateByUrl('/incomes');
      },
      error: (error: Error) => {
        this.isError.set(true);
        this.message.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  // Nueva FORMA
  readonly loginModel = signal<LoginPayload>({
    email: '',
    password: '',
  });

  readonly minimo = 9
  readonly maximo = 10
  readonly canLogin = computed(
    () => this.loginForm().valid()
  );



  //TODO: Realizar la migracion para que el mensaje se encuentre centralizado para configuracion español ingles, ahora lo dejaremos así
  loginForm = form(this.loginModel, (schemaPath) => {

    required(schemaPath.email, { message: 'Email is required', },);
    email(schemaPath.email, { message: 'Enter a valid email address' });


    required(schemaPath.password, { message: 'Password is required' });
    maxLength(schemaPath.password, this.maximo, { message: `Largo Maximo ${this.maximo}` });
    minLength(schemaPath.password, this.minimo, { message: `Largo Minimo ${this.minimo}` });
  });









}
