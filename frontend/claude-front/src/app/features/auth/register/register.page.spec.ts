import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { authFixture } from '../../../../testing/test-helpers';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let page: RegisterPage;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['register', 'homeUrl']);
    auth.homeUrl.and.returnValue('/incomes');
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(RegisterPage);
    page = fixture.componentInstance;
    await fixture.whenStable();
  });

  const submit = () => page.onSubmit(new Event('submit', { cancelable: true }));

  it('exige mínimo 8 caracteres y que coincidan las contraseñas', async () => {
    page.model.set({ fullName: 'Ana', email: 'ana@test.cl', password: '1234567', confirmPassword: '7654321' });
    await submit();
    expect(auth.register).not.toHaveBeenCalled();
    expect(page.registerForm.password().errors().map((e) => e.kind)).toContain('minLength');
    expect(page.registerForm.confirmPassword().errors().map((e) => e.kind)).toContain('passwordMismatch');
  });

  it('valida nombre (máx. 120) y correo', async () => {
    page.model.set({ fullName: 'x'.repeat(121), email: 'no-es-correo', password: '12345678', confirmPassword: '12345678' });
    await submit();
    expect(auth.register).not.toHaveBeenCalled();
    expect(page.registerForm.fullName().invalid()).toBeTrue();
    expect(page.registerForm.email().invalid()).toBeTrue();
  });

  it('registra con el payload del contrato (sin confirmPassword)', async () => {
    auth.register.and.returnValue(of(authFixture()));
    page.model.set({ fullName: ' Ana Pérez ', email: 'ana@test.cl', password: '12345678', confirmPassword: '12345678' });
    await submit();
    expect(auth.register).toHaveBeenCalledWith({ fullName: 'Ana Pérez', email: 'ana@test.cl', password: '12345678' });
    expect(page.model().password).toBe('');
  });
});
