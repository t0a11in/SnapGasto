import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TEST_API, authFixture, clearStorage } from '../../../testing/test-helpers';
import { API_BASE_URL, STORAGE_KEYS } from '../config/api.config';
import { errorInterceptor } from '../http/error.interceptor';
import { SessionStore } from '../state/session.store';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let ctrl: HttpTestingController;
  let session: SessionStore;

  beforeEach(() => {
    clearStorage();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: TEST_API },
      ],
    });
    service = TestBed.inject(AuthService);
    ctrl = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    ctrl.verify();
    clearStorage();
  });

  it('login guarda la sesión y recuerda solo el correo', () => {
    service.login({ email: 'ana@test.cl', password: 'secreta123' }, true).subscribe();
    const req = ctrl.expectOne(`${TEST_API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@test.cl', password: 'secreta123' });
    req.flush(authFixture());

    expect(session.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEYS.rememberedEmail)).toBe('ana@test.cl');
    const everything = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('|');
    expect(everything).not.toContain('secreta123');
  });

  it('login sin recordar borra el correo guardado', () => {
    localStorage.setItem(STORAGE_KEYS.rememberedEmail, 'viejo@test.cl');
    service.login({ email: 'ana@test.cl', password: 'x' }, false).subscribe();
    ctrl.expectOne(`${TEST_API}/auth/login`).flush(authFixture());
    expect(service.rememberedEmail()).toBeNull();
  });

  it('register envía fullName/email/password y abre sesión', () => {
    service.register({ fullName: 'Ana', email: 'ana@test.cl', password: '12345678' }).subscribe();
    const req = ctrl.expectOne(`${TEST_API}/auth/register`);
    expect(req.request.body).toEqual({ fullName: 'Ana', email: 'ana@test.cl', password: '12345678' });
    req.flush(authFixture());
    expect(session.isAuthenticated()).toBeTrue();
  });

  it('reauthenticate usa el correo de la sesión', () => {
    session.setSession(authFixture({}, 'viejo'));
    service.reauthenticate('clave1234').subscribe();
    const req = ctrl.expectOne(`${TEST_API}/auth/login`);
    expect(req.request.body).toEqual({ email: 'ana@test.cl', password: 'clave1234' });
    req.flush(authFixture({}, 'nuevo'));
    expect(session.token()).toBe('nuevo');
  });

  describe('validateStoredSession', () => {
    it('limpia la sesión si el token no está vivo', async () => {
      session.setSession(authFixture());
      const p = service.validateStoredSession();
      ctrl.expectOne(`${TEST_API}/auth/v1/token-status`).flush({ tokenAlive: false });
      await p;
      expect(session.isAuthenticated()).toBeFalse();
    });

    it('mantiene la sesión si el token está vivo', async () => {
      session.setSession(authFixture());
      const p = service.validateStoredSession();
      ctrl.expectOne(`${TEST_API}/auth/v1/token-status`).flush({ tokenAlive: true });
      await p;
      expect(session.isAuthenticated()).toBeTrue();
    });

    it('limpia la sesión ante 401/419', async () => {
      session.setSession(authFixture());
      const p = service.validateStoredSession();
      ctrl.expectOne(`${TEST_API}/auth/v1/token-status`).flush(null, { status: 419, statusText: 'E' });
      await p;
      expect(session.isAuthenticated()).toBeFalse();
    });

    it('conserva la sesión si el servidor no responde (estado 0)', async () => {
      session.setSession(authFixture());
      const p = service.validateStoredSession();
      ctrl.expectOne(`${TEST_API}/auth/v1/token-status`).error(new ProgressEvent('error'), { status: 0 });
      await p;
      expect(session.isAuthenticated()).toBeTrue();
    });

    it('sin sesión no llama al backend', async () => {
      await service.validateStoredSession();
      ctrl.expectNone(`${TEST_API}/auth/v1/token-status`);
    });
  });

  it('logout limpia y navega a /login', () => {
    const router = TestBed.inject(Router);
    const nav = spyOn(router, 'navigate').and.resolveTo(true);
    session.setSession(authFixture());
    service.logout();
    expect(session.isAuthenticated()).toBeFalse();
    expect(nav).toHaveBeenCalledWith(['/login']);
  });
});
