import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TEST_API } from '../../../testing/test-helpers';
import { API_BASE_URL } from '../../core/config/api.config';
import { CHART_MAX_CATEGORIES, ExpensesStore, OTHER_CATEGORY } from './expenses.store';

describe('ExpensesStore', () => {
  let store: ExpensesStore;
  let ctrl: HttpTestingController;
  const base = `${TEST_API}/expenses/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExpensesStore,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: TEST_API },
      ],
    });
    store = TestBed.inject(ExpensesStore);
    ctrl = TestBed.inject(HttpTestingController);
    store.month.set('2026-10');
  });

  afterEach(() => ctrl.verify());

  it('calcula total y totales por categoría', () => {
    store.load();
    ctrl.expectOne(`${base}/listar?month=2026-10`).flush([
      { id: '1', amount: 1000, category: 'Comida', date: '2026-10-01', description: null, paymentMethod: 'EFECTIVO' },
      { id: '2', amount: 2500, category: 'Transporte', date: '2026-10-02', description: null, paymentMethod: 'TARJETA' },
      { id: '3', amount: 500, category: 'Comida', date: '2026-10-03', description: null, paymentMethod: 'TARJETA' },
    ]);
    expect(store.total()).toBe(4000);
    expect(store.byCategory()).toEqual([
      { category: 'Transporte', total: 2500, count: 1, share: 0.625, colorHex: null },
      { category: 'Comida', total: 1500, count: 2, share: 0.375, colorHex: null },
    ]);
    expect(store.itemsOfCategory('Comida').map((e) => e.id)).toEqual(['3', '1']);
    expect(store.knownCategories()).toEqual(['Comida', 'Transporte']);
  });

  it('agrupa en "Otras" las categorías que exceden el máximo del gráfico', () => {
    store.load();
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), amount: (10 - i) * 100, category: `Cat ${i}`, date: '2026-10-01', description: null, paymentMethod: 'OTRO',
    }));
    ctrl.expectOne(`${base}/listar?month=2026-10`).flush(items);
    const rows = store.chartRows();
    expect(rows.length).toBe(CHART_MAX_CATEGORIES + 1);
    expect(rows.at(-1)!.category).toBe(OTHER_CATEGORY);
    expect(rows.at(-1)!.total).toBe(400 + 300 + 200 + 100);
    expect(rows.at(-1)!.count).toBe(4);
    expect(store.categoryColors().get('Cat 0')).toBe('#2a78d6');
    expect(store.categoryColors().get('Cat 9')).toBe(store.categoryColors().get(OTHER_CATEGORY));
  });

  it('incorpora el catálogo de categorías a las sugerencias', () => {
    store.loadCategories();
    ctrl.expectOne(`${TEST_API}/categories`).flush([
      { id: 'b', name: 'Salud', icon: null, colorHex: null },
      { id: 'a', name: 'Arriendo', icon: null, colorHex: '#FF0000' },
    ]);
    expect(store.categoriesAvailable()).toBeTrue();
    expect(store.categories().map((c) => c.name)).toEqual(['Arriendo', 'Salud']);
    expect(store.knownCategories()).toEqual(['Arriendo', 'Salud']);
  });

  it('sin endpoint de categorías las sugerencias salen de los gastos del mes', () => {
    store.loadCategories();
    ctrl.expectOne(`${TEST_API}/categories`).flush(null, { status: 404, statusText: 'Not Found' });
    expect(store.categoriesAvailable()).toBeFalse();
  });

  it('loadBalance obtiene el total de ingresos del resumen mensual', () => {
    store.loadBalance();
    ctrl
      .expectOne(`${TEST_API}/incomes/v1/resumen?month=2026-10`)
      .flush({ month: '2026-10', totalTarjeta: 600000, totalFisico: 100000, total: 700000 });
    expect(store.incomeTotal()).toBe(700000);
  });

  it('crear y actualizar usan las rutas del contrato', () => {
    const body = { amount: 10, category: 'Comida', date: '2026-10-01', description: null, paymentMethod: 'OTRO' };
    store.save(null, body).subscribe();
    ctrl.expectOne({ method: 'POST', url: `${base}/crear` }).flush({ id: '1', ...body });
    ctrl.expectOne(`${base}/listar?month=2026-10`).flush([]);

    store.save('1', body).subscribe();
    ctrl.expectOne({ method: 'PUT', url: `${base}/1/actualizar` }).flush({ id: '1', ...body });
    ctrl.expectOne(`${base}/listar?month=2026-10`).flush([]);

    store.remove('1').subscribe();
    ctrl.expectOne({ method: 'DELETE', url: `${base}/1/eliminar` }).flush(null, { status: 204, statusText: '' });
    ctrl.expectOne(`${base}/listar?month=2026-10`).flush([]);
  });
});
