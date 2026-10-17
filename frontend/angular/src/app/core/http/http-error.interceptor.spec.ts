import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AppStore } from '../state/App.store';
import { SessionStore } from '../state/session.store';
import { httpErrorInterceptor } from './http-error.interceptor';

const API_URL = 'http://api.test/api';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let appStore: AppStore;
  let sessionStore: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: API_URL },
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    appStore = TestBed.inject(AppStore);
    sessionStore = TestBed.inject(SessionStore);
    spyOn(console, 'error');
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('opens the circuit breaker when the API cannot be reached', () => {
    http.get(`${API_URL}/incomes/listar`).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(`${API_URL}/incomes/listar`);
    request.error(new ProgressEvent('error'));

    expect(appStore.circuit_braker()).toBe('OPEN');
  });

  it('closes the circuit breaker after a successful API response', () => {
    appStore.setCircuitBreaker('OPEN');
    http.get(`${API_URL}/incomes/listar`).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/incomes/listar`);
    request.flush([]);

    expect(appStore.circuit_braker()).toBe('CLOSED');
  });

  it('does not open the circuit breaker for an authentication error', () => {
    appStore.setCircuitBreaker('CLOSED');
    sessionStore.start({
      accessToken: 'jwt-token',
      user: { id: 'u-1', fullName: 'Ana', email: 'ana@example.com', role: 'USER' }
    });
    http.get(`${API_URL}/incomes/listar`).subscribe({ error: () => undefined });

    const request = httpTesting.expectOne(`${API_URL}/incomes/listar`);
    request.flush({ message: 'No autorizado.' }, { status: 401, statusText: 'Unauthorized' });

    expect(appStore.circuit_braker()).toBe('CLOSED');
    expect(appStore.tokenLife()).toBe('CLOSED');
    expect(sessionStore.session()).toBeNull();
  });
});
