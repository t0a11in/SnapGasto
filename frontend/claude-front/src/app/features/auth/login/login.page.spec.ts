import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authFixture } from '../../../../testing/test-helpers';
import { AppHttpError } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../shared/services/alert.service';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let auth: jasmine.SpyObj<AuthService>;
  let alerts: jasmine.SpyObj<AlertService>;
  let el: HTMLElement;

  async function setup(remembered: string | null = null): Promise<void> {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'rememberedEmail', 'homeUrl']);
    auth.rememberedEmail.and.returnValue(remembered);
    auth.homeUrl.and.returnValue('/incomes');
    alerts = jasmine.createSpyObj<AlertService>('AlertService', ['error', 'top']);
    alerts.error.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AlertService, useValue: alerts },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  const input = (sel: string) => el.querySelector<HTMLInputElement>(sel)!;
  const type = (sel: string, value: string) => {
    const i = input(sel);
    i.value = value;
    i.dispatchEvent(new Event('input'));
  };
  const submitForm = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  it('precarga el correo recordado y marca el checkbox', async () => {
    await setup('ana@test.cl');
    expect(input('#login-email').value).toBe('ana@test.cl');
    expect(input('#login-remember').checked).toBeTrue();
  });

  it('no envía si el formulario es inválido y muestra errores', async () => {
    await setup();
    await submitForm();
    expect(auth.login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Ingresa tu correo.');
    expect(el.textContent).toContain('Ingresa tu contraseña.');
  });

  it('envía credenciales, limpia la contraseña y navega', async () => {
    await setup();
    auth.login.and.returnValue(of(authFixture()));
    type('#login-email', ' ana@test.cl ');
    type('input[autocomplete="current-password"]', 'secreta123');
    input('#login-remember').click();
    await fixture.whenStable();
    await submitForm();
    expect(auth.login).toHaveBeenCalledWith({ email: 'ana@test.cl', password: 'secreta123' }, true);
    expect(fixture.componentInstance.model().password).toBe('');
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/incomes');
  });

  it('credenciales inválidas → alerta superior "Correo o contraseña incorrectos"', async () => {
    await setup();
    auth.login.and.returnValue(throwError(() => new AppHttpError(401, 'Bad credentials')));
    type('#login-email', 'ana@test.cl');
    type('input[autocomplete="current-password"]', 'mala');
    await submitForm();
    expect(alerts.error).toHaveBeenCalledWith('Correo o contraseña incorrectos', undefined);
    expect(el.querySelector('.alert-danger')).toBeNull();
  });

  it('otros errores muestran la alerta con el mensaje del backend', async () => {
    await setup();
    auth.login.and.returnValue(throwError(() => new AppHttpError(0, 'No fue posible conectar')));
    type('#login-email', 'ana@test.cl');
    type('input[autocomplete="current-password"]', 'x');
    await submitForm();
    expect(alerts.error).toHaveBeenCalledWith('No fue posible iniciar sesión', 'No fue posible conectar');
  });

  it('el botón muestra/oculta la contraseña', async () => {
    await setup();
    const pwd = input('input[autocomplete="current-password"]');
    expect(pwd.type).toBe('password');
    el.querySelector<HTMLButtonElement>('button[aria-label="Mostrar contraseña"]')!.click();
    await fixture.whenStable();
    expect(pwd.type).toBe('text');
  });
});
