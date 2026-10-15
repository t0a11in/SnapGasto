import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AdminApiService } from './admin-api.service';

const API_URL = 'http://api.test/api';

describe('AdminApiService', () => {
  let service: AdminApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_URL }
      ]
    });
    service = TestBed.inject(AdminApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads the administrative users endpoint', () => {
    let usersCount = -1;
    service.users().subscribe((users) => usersCount = users.length);

    const request = httpTesting.expectOne(`${API_URL}/admin/users`);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'u-1', fullName: 'Ana', email: 'ana@example.com', role: 'ADMIN', createdAt: '2026-10-13T10:00:00' }]);

    expect(usersCount).toBe(1);
  });

  it('sends the exact payload when creating a category', () => {
    const payload = { name: 'Alimentación', icon: '🛒', colorHex: '#2563eb' };
    service.createCategory(payload).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/admin/categories`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 'c-1', ...payload });
  });
});
