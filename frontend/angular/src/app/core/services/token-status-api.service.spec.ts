import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { TokenStatusApiService } from './token-status-api.service';

describe('TokenStatusApiService', () => {
  let service: TokenStatusApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.test/api' }
      ]
    });
    service = TestBed.inject(TokenStatusApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('checks the protected versioned token-status endpoint', () => {
    service.check().subscribe((result) => expect(result.tokenAlive).toBeTrue());

    const request = httpTesting.expectOne('http://api.test/api/auth/v1/token-status');
    expect(request.request.method).toBe('GET');
    request.flush({ tokenAlive: true });
  });

  it('conserves the API error message when the token is rejected', () => {
    let message = '';
    service.check().subscribe({ error: (error: Error) => message = error.message });

    const request = httpTesting.expectOne('http://api.test/api/auth/v1/token-status');
    request.flush({ message: 'No autorizado.' }, { status: 401, statusText: 'Unauthorized' });

    expect(message).toBe('No autorizado.');
  });
});
