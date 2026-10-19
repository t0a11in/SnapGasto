import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TEST_API } from '../../../testing/test-helpers';
import { API_BASE_URL } from '../../core/config/api.config';
import { IncomesStore } from './incomes.store';

describe('IncomesStore', () => {
  let store: IncomesStore;
  let ctrl: HttpTestingController;
  const base = `${TEST_API}/incomes/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IncomesStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: TEST_API },
      ],
    });
    store = TestBed.inject(IncomesStore);
    ctrl = TestBed.inject(HttpTestingController);
    store.month.set('2026-10');
  });

  afterEach(() => ctrl.verify());

  const flushLoad = (month = '2026-10', items: unknown[] = []) => {
    ctrl.expectOne(`${base}/listar?month=${month}`).flush(items);
    ctrl.expectOne(`${base}/resumen?month=${month}`).flush({ month, totalTarjeta: 10, totalFisico: 5, total: 15 });
  };

  it('carga listado y resumen del mes', () => {
    store.load();
    expect(store.loading()).toBeTrue();
    flushLoad('2026-10', [
      { id: '1', amount: 10, type: 'TARJETA', date: '2026-10-01', description: null },
      { id: '2', amount: 5, type: 'FISICO', date: '2026-10-09', description: 'x' },
    ]);
    expect(store.loading()).toBeFalse();
    expect(store.summary()?.total).toBe(15);
    expect(store.sortedItems().map((i) => i.id)).toEqual(['2', '1']);
  });

  it('setMonth recarga con el nuevo mes', () => {
    store.setMonth('2026-09');
    flushLoad('2026-09');
    ctrl.expectOne(`${TEST_API}/expenses/v1/listar?month=2026-09`).flush([]);
    expect(store.month()).toBe('2026-09');
  });

  it('loadBalance suma los gastos del mes para la diferencia', () => {
    store.loadBalance();
    ctrl.expectOne(`${TEST_API}/expenses/v1/listar?month=2026-10`).flush([{ amount: 1500 }, { amount: 2500 }]);
    expect(store.expenseTotal()).toBe(4000);
  });

  it('si los gastos no cargan, el balance queda no disponible', () => {
    store.loadBalance();
    ctrl.expectOne(`${TEST_API}/expenses/v1/listar?month=2026-10`).flush(null, { status: 500, statusText: 'E' });
    expect(store.expenseTotal()).toBeNull();
  });

  it('crear usa POST /crear y luego recarga', () => {
    const body = { amount: 1000, type: 'TARJETA' as const, date: '2026-10-02', description: null };
    store.save(null, body).subscribe();
    const req = ctrl.expectOne(`${base}/crear`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: '9', ...body });
    flushLoad();
  });

  it('actualizar usa PUT /{id}/actualizar y eliminar DELETE /{id}/eliminar', () => {
    store.save('7', { amount: 1, type: 'FISICO', date: '2026-10-02' }).subscribe();
    const put = ctrl.expectOne(`${base}/7/actualizar`);
    expect(put.request.method).toBe('PUT');
    put.flush({});
    flushLoad();

    store.remove('7').subscribe();
    const del = ctrl.expectOne(`${base}/7/eliminar`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    flushLoad();
  });

  it('expone el mensaje de error', () => {
    store.load();
    const resumen = ctrl.expectOne(`${base}/resumen?month=2026-10`);
    ctrl.expectOne(`${base}/listar?month=2026-10`).flush({ message: 'Fallo' }, { status: 500, statusText: 'E' });
    expect(resumen.cancelled).toBeTrue();
    expect(store.error()).toBe('Fallo');
  });
});
