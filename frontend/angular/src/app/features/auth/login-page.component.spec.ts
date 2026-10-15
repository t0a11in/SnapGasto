import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../../core/services/auth-api.service';
import { SessionStore } from '../../core/state/session.store';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  const authApi = { login: vi.fn(), register: vi.fn(), logout: vi.fn() };
  const sessionStore = { clear: vi.fn() };
  const router = { navigateByUrl: vi.fn() };

  beforeEach(async () => {
    authApi.login.mockReset();
    authApi.register.mockReset();
    sessionStore.clear.mockReset();
    router.navigateByUrl.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthApiService, useValue: authApi },
        { provide: SessionStore, useValue: sessionStore },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
  });

  it('renders the administrative access screen', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Mantenedores');
  });

  it('navigates to the dashboard when an administrator logs in', () => {
    authApi.login.mockReturnValue(of({
      accessToken: 'jwt',
      user: { id: 'u-1', fullName: 'Ana', email: 'ana@example.com', role: 'ADMIN' }
    }));
    const fixture = TestBed.createComponent(LoginPageComponent);
    const component = fixture.componentInstance;
    component.form.setValue({ fullName: '', email: 'ana@example.com', password: 'secreto123' });
    component.submit();
    // console.log(authApi);
    console.log('authApi');
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secreto123' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin');
  });
});
