import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../config/api-base-url.token';
import { ExpenseApiService } from './expense-api.service';

const API_URL = 'http://api.test/api';

describe('ExpenseApiService', () => {
  let service: ExpenseApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API_URL },
      ],
    });
    service = TestBed.inject(ExpenseApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lists the authenticated user expenses for the selected month', () => {
    service.list('2026-10').subscribe();

    const request = httpTesting.expectOne(`${API_URL}/expenses/v1/listar?month=2026-10`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('creates an expense with its category and payment method', () => {
    const payload = {
      amount: 15990,
      category: 'Alimentación',
      date: '2026-10-18',
      description: 'Compra semanal',
      paymentMethod: 'TARJETA' as const,
    };

    service.create(payload).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/expenses/v1/crear`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 'expense-1', ...payload });
  });

  it('updates an existing expense', () => {
    const payload = {
      amount: 12000,
      category: 'Transporte',
      date: '2026-10-17',
      description: null,
      paymentMethod: 'EFECTIVO' as const,
    };

    service.update('expense-1', payload).subscribe();

    const request = httpTesting.expectOne(`${API_URL}/expenses/v1/expense-1/actualizar`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(payload);
    request.flush({ id: 'expense-1', ...payload });
  });

  it('deletes an expense', () => {
    service.delete('expense-1').subscribe();

    const request = httpTesting.expectOne(`${API_URL}/expenses/v1/expense-1/eliminar`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
