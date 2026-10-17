import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AppStore } from '../state/App.store';
import { tokenLifeInterceptor } from './token-life.interceptor';

const API_URL = 'http://api.test/api';

describe('tokenLifeInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let appStore: AppStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: API_BASE_URL, useValue: API_URL },
        provideHttpClient(withInterceptors([tokenLifeInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    appStore = TestBed.inject(AppStore);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('does not send protected API requests while the token life is CLOSED', () => {
    appStore.setTokenLife('CLOSED');
    let receivedError: HttpErrorResponse | undefined;

    http.get(`${API_URL}/incomes/listar`).subscribe({
      error: (error: HttpErrorResponse) => receivedError = error,
    });

    httpTesting.expectNone(`${API_URL}/incomes/listar`);
    expect(receivedError?.status).toBe(401);
    expect(receivedError?.error.message).toBe('La sesión está cerrada. Inicia sesión nuevamente.');
  });

  it('allows public authentication requests while the token life is CLOSED', () => {
    appStore.setTokenLife('CLOSED');
    http.post(`${API_URL}/auth/login`, {}).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush({});
  });

  it('allows protected API requests after the token life is OPEN', () => {
    appStore.setTokenLife('OPEN');
    http.get(`${API_URL}/incomes/listar`).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/incomes/listar`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
