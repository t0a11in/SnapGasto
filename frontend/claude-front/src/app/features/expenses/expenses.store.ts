import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { errorMessage } from '../../core/http/error.utils';
import { CategoryResponse, ExpenseRequest, ExpenseResponse } from '../../core/models';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { ExpensesApiService } from '../../core/services/expenses-api.service';
import { IncomesApiService } from '../../core/services/incomes-api.service';
import { CATEGORICAL_PALETTE, OTHER_COLOR } from '../../core/utils/chart-palette';
import { currentMonth } from '../../core/utils/date.utils';
import { sumAmounts } from '../../core/utils/money.utils';

export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  /** Proporción del total del mes (0..1). */
  share: number;
  colorHex: string | null;
}

/** Máximo de categorías individuales en el gráfico; el resto se agrupa en "Otras". */
export const CHART_MAX_CATEGORIES = CATEGORICAL_PALETTE.length;
export const OTHER_CATEGORY = 'Otras';

/** Estado de la pantalla de gastos. El total mensual se calcula en el front. */
@Injectable()
export class ExpensesStore {
  private readonly api = inject(ExpensesApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly incomesApi = inject(IncomesApiService);

  readonly month = signal(currentMonth());
  readonly items = signal<ExpenseResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Si el endpoint de categorías no responde, el formulario usa texto libre. */
  readonly categories = signal<CategoryResponse[]>([]);
  readonly categoriesAvailable = signal(false);

  /** Ingresos del mismo mes, para el balance ingresos − gastos (null = no disponible). */
  readonly incomeTotal = signal<number | null>(null);

  readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => b.date.localeCompare(a.date)),
  );
  readonly total = computed(() => sumAmounts(this.items()));
  readonly byCategory = computed<CategoryTotal[]>(() => {
    const colors = new Map(this.categories().map((c) => [c.name, c.colorHex]));
    const acc = new Map<string, { total: number; count: number }>();
    for (const e of this.items()) {
      const row = acc.get(e.category) ?? { total: 0, count: 0 };
      row.total += Number(e.amount);
      row.count += 1;
      acc.set(e.category, row);
    }
    const grand = this.total();
    return [...acc.entries()]
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        share: grand > 0 ? total / grand : 0,
        colorHex: colors.get(category) ?? null,
      }))
      .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
  });

  /** Datos del gráfico: top N categorías + "Otras" agrupadas. */
  readonly chartRows = computed<CategoryTotal[]>(() => {
    const rows = this.byCategory();
    if (rows.length <= CHART_MAX_CATEGORIES) {
      return rows;
    }
    const top = rows.slice(0, CHART_MAX_CATEGORIES);
    const rest = rows.slice(CHART_MAX_CATEGORIES);
    const total = rest.reduce((a, r) => a + r.total, 0);
    return [
      ...top,
      {
        category: OTHER_CATEGORY,
        total,
        count: rest.reduce((a, r) => a + r.count, 0),
        share: rest.reduce((a, r) => a + r.share, 0),
        colorHex: null,
      },
    ];
  });

  /** Color de cada categoría según su posición en el gráfico (las agrupadas en "Otras", gris). */
  readonly categoryColors = computed<ReadonlyMap<string, string>>(() => {
    const map = new Map<string, string>();
    this.byCategory().forEach((row, i) => {
      const named = i < CHART_MAX_CATEGORIES || this.byCategory().length <= CHART_MAX_CATEGORIES;
      map.set(row.category, named ? CATEGORICAL_PALETTE[i] : OTHER_COLOR);
    });
    map.set(OTHER_CATEGORY, OTHER_COLOR);
    return map;
  });

  /** Categorías para autocompletar: catálogo + las ya usadas en el mes. */
  readonly knownCategories = computed(() => {
    const names = new Set<string>();
    for (const c of this.categories()) {
      names.add(c.name);
    }
    for (const e of this.items()) {
      names.add(e.category);
    }
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));
  });

  /** Gastos de una categoría del mes, del más reciente al más antiguo. */
  itemsOfCategory(category: string): ExpenseResponse[] {
    return this.sortedItems().filter((e) => e.category === category);
  }

  load(): void {
    const month = this.month();
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(month)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          if (month === this.month()) {
            this.items.set(items ?? []);
          }
        },
        error: (err: unknown) => this.error.set(errorMessage(err)),
      });
  }

  loadCategories(): void {
    this.categoriesApi.list().subscribe({
      next: (list) => {
        this.categories.set([...(list ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
        this.categoriesAvailable.set((list ?? []).length > 0);
      },
      error: () => {
        this.categories.set([]);
        this.categoriesAvailable.set(false);
      },
    });
  }

  /** Carga el total de ingresos del mes (resumen) para mostrar la diferencia. */
  loadBalance(): void {
    const month = this.month();
    this.incomeTotal.set(null);
    this.incomesApi
      .summary(month)
      .pipe(
        map((summary) => Number(summary?.total ?? 0)),
        catchError(() => of(null)),
      )
      .subscribe((total) => {
        if (month === this.month()) {
          this.incomeTotal.set(total);
        }
      });
  }

  setMonth(month: string): void {
    if (month !== this.month()) {
      this.month.set(month);
      this.load();
      this.loadBalance();
    }
  }

  save(id: string | null, body: ExpenseRequest): Observable<ExpenseResponse> {
    const request$ = id ? this.api.update(id, body) : this.api.create(body);
    return request$.pipe(tap(() => this.load()));
  }

  remove(id: string): Observable<void> {
    return this.api.remove(id).pipe(tap(() => this.load()));
  }
}
