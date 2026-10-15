import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthResponse } from '../models/api.models';
import { SessionStore } from '../state/session.store';
import { AuthApiService } from './auth-api.service';

const API_URL = 'http://api.test/api';
const session: AuthResponse = {
  accessToken: 'test-token',
  user: { id: 'u-1', fullName: 'Ana Admin', email: 'ana@example.com', role: 'ADMIN' }
};

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTesting: HttpTestingController;
  let sessionStore: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_URL }
      ]
    });
    service = TestBed.inject(AuthApiService);
    httpTesting = TestBed.inject(HttpTestingController);
    sessionStore = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('sends credentials and persists a successful session', () => {
    service.login({ email: 'ana@example.com', password: 'secreto123' }).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com', password: 'secreto123' });
    request.flush(session);

    expect(sessionStore.session()).toEqual(session);
    expect(JSON.parse(localStorage.getItem('snapgasto.admin.session') ?? '{}')).toEqual(session);
  });

  it('exposes the API error message', () => {
    let message = '';
    service.login({ email: 'ana@example.com', password: 'secreto123' }).subscribe({
      error: (error: Error) => message = error.message
    });

    httpTesting.expectOne(`${API_URL}/auth/login`).flush(
      { message: 'Correo o contraseña incorrectos.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(message).toBe('Correo o contraseña incorrectos.');
  });
});
