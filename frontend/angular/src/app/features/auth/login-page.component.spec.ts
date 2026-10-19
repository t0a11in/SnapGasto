import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionStore } from '../../core/state/session.store';
import { AuthCredentialsFormComponent } from '../../shared/components/auth-credentials-form/auth-credentials-form.component';
import { LoginPageComponent } from './login-page.component';

describe('1) Login COMPONENT', () => {
  const authApi = jasmine.createSpyObj<AuthApiService>('AuthApiService', ['login', 'register', 'logout']);
  const sessionStore = jasmine.createSpyObj<SessionStore>('SessionStore', ['clear']);
  const router = jasmine.createSpyObj<Pick<Router, 'navigateByUrl'>>('Router', ['navigateByUrl']);

  function credentialsForm(fixture: ComponentFixture<LoginPageComponent>): AuthCredentialsFormComponent {
    return fixture.debugElement.query(By.directive(AuthCredentialsFormComponent)).componentInstance;
  }

  beforeEach(async () => {
    localStorage.clear();
    authApi.login.calls.reset();
    authApi.register.calls.reset();
    authApi.logout.calls.reset();
    sessionStore.clear.calls.reset();
    router.navigateByUrl.calls.reset();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthApiService, useValue: authApi },
        { provide: SessionStore, useValue: sessionStore },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } }
      ]
    }).compileComponents();
  });

  it('Revisa Palabras Claves', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('*')?.textContent).toContain('Gestiona tus ingresos');
  });

  it('Redireccion a dashboard tras login', () => {
    authApi.login.and.returnValue(of({
      accessToken: 'jwt',
      user: { id: 'u-1', fullName: 'Ana', email: 'ana@example.com', role: 'ADMIN' }
    }));
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    const form = credentialsForm(fixture);
    form.credentials.set({ fullName: '', email: 'ana@example.com', password: 'secreto123', rememberPassword: false });
    form.submit();
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secreto123' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/incomes');
  });

  it('Disabled button only email', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    credentialsForm(fixture).credentials.set({ fullName: '', email: 'ana@example.com', password: '', rememberPassword: false });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    expect(button).not.toBeNull()
    expect(button.disabled).toBeTrue();
  });

  it('Disabled button not real email', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    credentialsForm(fixture).credentials.set({ fullName: '', email: 'xxx.xxxx.com', password: 'xxxx', rememberPassword: false });
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    expect(button).not.toBeNull()
    expect(button.disabled).toBeTrue();
  });

  it('Not disabled button', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    credentialsForm(fixture).credentials.set({ fullName: '', email: 'xxxx@xxxx.com', password: '1234567890', rememberPassword: false });
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    expect(button).not.toBeNull()
    expect(button.disabled).toBeFalse();
  });
});
