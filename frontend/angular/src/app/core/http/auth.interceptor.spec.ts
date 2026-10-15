import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { SessionStore } from '../state/session.store';
import { authInterceptor } from './auth.interceptor';

const API_URL = 'http://api.test/api';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let sessionStore: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: API_URL },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    sessionStore = TestBed.inject(SessionStore);
    sessionStore.start({
      accessToken: 'jwt-token',
      user: { id: 'u-1', fullName: 'Ana', email: 'ana@example.com', role: 'ADMIN' }
    });
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('adds Bearer JWT to protected API calls', () => {
    http.get(`${API_URL}/admin/users`).subscribe();
    const request = httpTesting.expectOne(`${API_URL}/admin/users`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('does not send a stale token to public authentication endpoints', () => {
    http.post(`${API_URL}/auth/login`, {}).subscribe();
    const request = httpTesting.expectOne(`${API_URL}/auth/login`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
