import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { IncomeApiService } from './income-api.service';

const API_URL = 'http://api.test/api';

describe('IncomeApiService', () => {
  let service: IncomeApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_URL }
      ]
    });
    service = TestBed.inject(IncomeApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('uses the versioned listing endpoint and sends the selected month', () => {
    service.list('2026-10').subscribe();

    const request = httpTesting.expectOne(`${API_URL}/incomes/v1/listar?month=2026-10`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates an income with its selected source', () => {
    const payload = { amount: 15000, type: 'TARJETA' as const, date: '2026-10-16', description: 'Sueldo' };
    service.create(payload).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/incomes/v1/crear`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 'i-1', ...payload });
  });

  it('loads the monthly combined summary for the selected month', () => {
    service.summary('2026-09').subscribe((summary) => expect(summary.total).toBe(23000));

    const request = httpTesting.expectOne(`${API_URL}/incomes/v1/resumen?month=2026-09`);
    expect(request.request.method).toBe('GET');
    request.flush({ month: '2026-09', totalTarjeta: 15000, totalFisico: 8000, total: 23000 });
  });
});
