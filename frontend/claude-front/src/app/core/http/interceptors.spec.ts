import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { TEST_API, authFixture, clearStorage } from '../../../testing/test-helpers';
import { API_BASE_URL } from '../config/api.config';
import { AppHttpError } from '../models';
import { AuthApiService } from '../services/auth-api.service';
import { AuthService } from '../services/auth.service';
import { ReauthService } from '../services/reauth.service';
import { SessionStore } from '../state/session.store';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';
import { sessionExpiredInterceptor } from './session-expired.interceptor';

describe('Interceptores HTTP', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let session: SessionStore;
  let reauth: jasmine.SpyObj<ReauthService>;
  let auth: AuthService;

  beforeEach(() => {
    clearStorage();
    reauth = jasmine.createSpyObj<ReauthService>('ReauthService', ['reauthenticate']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor, sessionExpiredInterceptor, authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: TEST_API },
        { provide: ReauthService, useValue: reauth },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionStore);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    ctrl.verify();
    clearStorage();
  });

  describe('authInterceptor', () => {
    it('agrega Bearer a la API propia', () => {
      session.setSession(authFixture());
      http.get(`${TEST_API}/expenses/v1/listar`).subscribe();
      const req = ctrl.expectOne(`${TEST_API}/expenses/v1/listar`);
      expect(req.request.headers.get('Authorization')).toBe('Bearer token-1');
      req.flush([]);
    });

    it('no agrega Bearer a login/registro ni a otros dominios', () => {
      session.setSession(authFixture());
      TestBed.inject(AuthApiService).login({ email: 'a@b.cl', password: 'x' }).subscribe();
      http.get('https://otro.dominio/x').subscribe();
      const login = ctrl.expectOne(`${TEST_API}/auth/login`);
      const other = ctrl.expectOne('https://otro.dominio/x');
      expect(login.request.headers.has('Authorization')).toBeFalse();
      expect(other.request.headers.has('Authorization')).toBeFalse();
      login.flush(authFixture());
      other.flush({});
    });

    it('no agrega header sin sesión', () => {
      http.get(`${TEST_API}/incomes/v1/listar`).subscribe();
      const req = ctrl.expectOne(`${TEST_API}/incomes/v1/listar`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush([]);
    });
  });

  describe('errorInterceptor', () => {
    it('normaliza a AppHttpError con el mensaje de Java', () => {
      let error: unknown;
      http.get(`${TEST_API}/x`).subscribe({ error: (e) => (error = e) });
      ctrl.expectOne(`${TEST_API}/x`).flush({ message: 'Categoría inválida' }, { status: 400, statusText: 'Bad' });
      expect(error).toEqual(jasmine.any(AppHttpError));
      expect((error as AppHttpError).message).toBe('Categoría inválida');
    });

    it('cierra sesión ante 401 en rutas protegidas', () => {
      session.setSession(authFixture());
      const logout = spyOn(auth, 'logout').and.callThrough();
      http.get(`${TEST_API}/x`).subscribe({ error: () => undefined });
      ctrl.expectOne(`${TEST_API}/x`).flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(logout).toHaveBeenCalled();
    });

    it('no cierra sesión ante 401 del login (credenciales inválidas)', () => {
      const logout = spyOn(auth, 'logout');
      TestBed.inject(AuthApiService).login({ email: 'a@b.cl', password: 'mala' }).subscribe({ error: () => undefined });
      ctrl.expectOne(`${TEST_API}/auth/login`).flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'U' });
      expect(logout).not.toHaveBeenCalled();
    });
  });

  describe('sessionExpiredInterceptor (419)', () => {
    it('reautentica y reintenta con el token nuevo', () => {
      session.setSession(authFixture({}, 'viejo'));
      reauth.reauthenticate.and.callFake(() => {
        session.setSession(authFixture({}, 'nuevo'));
        return of(true);
      });
      let result: unknown;
      http.get(`${TEST_API}/expenses/v1/listar`).subscribe((r) => (result = r));

      const first = ctrl.expectOne(`${TEST_API}/expenses/v1/listar`);
      expect(first.request.headers.get('Authorization')).toBe('Bearer viejo');
      first.flush(null, { status: 419, statusText: 'Session Expired' });

      const retry = ctrl.expectOne(`${TEST_API}/expenses/v1/listar`);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer nuevo');
      retry.flush([{ id: '1' }]);

      expect(reauth.reauthenticate).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: '1' }]);
    });

    it('propaga el error si se cancela la reautenticación', () => {
      session.setSession(authFixture());
      reauth.reauthenticate.and.returnValue(of(false));
      let error: AppHttpError | undefined;
      http.get(`${TEST_API}/x`).subscribe({ error: (e) => (error = e) });
      ctrl.expectOne(`${TEST_API}/x`).flush(null, { status: 419, statusText: 'Expired' });
      expect(error?.status).toBe(419);
    });

    it('no entra en bucle si el reintento vuelve a responder 419', () => {
      session.setSession(authFixture());
      reauth.reauthenticate.and.returnValue(of(true));
      let error: AppHttpError | undefined;
      http.get(`${TEST_API}/x`).subscribe({ error: (e) => (error = e) });
      ctrl.expectOne(`${TEST_API}/x`).flush(null, { status: 419, statusText: 'Expired' });
      ctrl.expectOne(`${TEST_API}/x`).flush(null, { status: 419, statusText: 'Expired' });
      expect(reauth.reauthenticate).toHaveBeenCalledTimes(1);
      expect(error?.status).toBe(419);
    });

    it('varias peticiones simultáneas esperan una única reautenticación', () => {
      session.setSession(authFixture());
      const gate = new Subject<boolean>();
      const shared = gate.asObservable();
      reauth.reauthenticate.and.returnValue(shared);
      http.get(`${TEST_API}/a`).subscribe();
      http.get(`${TEST_API}/b`).subscribe();
      ctrl.expectOne(`${TEST_API}/a`).flush(null, { status: 419, statusText: 'E' });
      ctrl.expectOne(`${TEST_API}/b`).flush(null, { status: 419, statusText: 'E' });
      gate.next(true);
      gate.complete();
      ctrl.expectOne(`${TEST_API}/a`).flush({});
      ctrl.expectOne(`${TEST_API}/b`).flush({});
    });

    it('token-status nunca abre el modal', () => {
      session.setSession(authFixture());
      TestBed.inject(AuthApiService).tokenStatus().subscribe({ error: () => undefined });
      ctrl.expectOne(`${TEST_API}/auth/v1/token-status`).flush(null, { status: 419, statusText: 'E' });
      expect(reauth.reauthenticate).not.toHaveBeenCalled();
    });
  });
});
