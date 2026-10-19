import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TEST_API } from '../../../testing/test-helpers';
import { API_BASE_URL } from '../config/api.config';
import {
  AdminCategoriesApiService,
  AdminExpensesApiService,
  AdminNotificationsApiService,
  AdminUsersApiService,
} from './admin-api.services';

describe('Admin CRUD API (REST estándar)', () => {
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: TEST_API }],
    });
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('usuarios: GET lista, POST crea, PATCH actualiza, DELETE elimina', () => {
    const api = TestBed.inject(AdminUsersApiService);
    const base = `${TEST_API}/admin/users`;

    api.list().subscribe();
    ctrl.expectOne({ method: 'GET', url: base }).flush([]);

    api.create({ fullName: 'A', email: 'a@b.cl', role: 'USER', password: '12345678' }).subscribe();
    ctrl.expectOne({ method: 'POST', url: base }).flush({});

    api.update('id-1', { fullName: 'B', email: 'a@b.cl', role: 'ADMIN' }).subscribe();
    const patch = ctrl.expectOne({ method: 'PATCH', url: `${base}/id-1` });
    expect(patch.request.body).toEqual({ fullName: 'B', email: 'a@b.cl', role: 'ADMIN' });
    patch.flush({});

    api.remove('id-1').subscribe();
    ctrl.expectOne({ method: 'DELETE', url: `${base}/id-1` }).flush(null, { status: 204, statusText: 'No Content' });
  });

  it('cada mantenedor apunta a su recurso', () => {
    TestBed.inject(AdminCategoriesApiService).list().subscribe();
    TestBed.inject(AdminExpensesApiService).list().subscribe();
    TestBed.inject(AdminNotificationsApiService).get('n 1').subscribe();
    ctrl.expectOne(`${TEST_API}/admin/categories`).flush([]);
    ctrl.expectOne(`${TEST_API}/admin/expenses`).flush([]);
    ctrl.expectOne(`${TEST_API}/admin/notifications/n%201`).flush({});
  });
});
