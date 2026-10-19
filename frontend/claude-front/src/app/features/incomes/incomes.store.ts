import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, of, tap } from 'rxjs';
import { errorMessage } from '../../core/http/error.utils';
import { IncomeMonthlySummaryResponse, IncomeRequest, IncomeResponse } from '../../core/models';
import { ExpensesApiService } from '../../core/services/expenses-api.service';
import { IncomesApiService } from '../../core/services/incomes-api.service';
import { sumAmounts } from '../../core/utils/money.utils';
import { currentMonth } from '../../core/utils/date.utils';

/** Estado de la pantalla de ingresos (mes seleccionado, listado y resumen). */
@Injectable()
export class IncomesStore {
  private readonly api = inject(IncomesApiService);
  private readonly expensesApi = inject(ExpensesApiService);

  readonly month = signal(currentMonth());
  readonly items = signal<IncomeResponse[]>([]);
  readonly summary = signal<IncomeMonthlySummaryResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Gastos del mismo mes, para el balance ingresos − gastos (null = no disponible). */
  readonly expenseTotal = signal<number | null>(null);
  readonly incomeTotal = computed(() => this.summary()?.total ?? sumAmounts(this.items()));

  readonly sortedItems = computed(() =>
    [...this.items()].sort((a, b) => b.date.localeCompare(a.date)),
  );

  load(): void {
    const month = this.month();
    this.loading.set(true);
    this.error.set(null);
    forkJoin({ items: this.api.list(month), summary: this.api.summary(month) })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ items, summary }) => {
          if (month !== this.month()) {
            return; // respuesta de un mes que ya no está seleccionado
          }
          this.items.set(items ?? []);
          this.summary.set(summary);
        },
        error: (err: unknown) => this.error.set(errorMessage(err)),
      });
  }

  /** Carga el total de gastos del mes para mostrar la diferencia. */
  loadBalance(): void {
    const month = this.month();
    this.expenseTotal.set(null);
    this.expensesApi
      .list(month)
      .pipe(
        map((list) => sumAmounts(list ?? [])),
        catchError(() => of(null)),
      )
      .subscribe((total) => {
        if (month === this.month()) {
          this.expenseTotal.set(total);
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

  save(id: string | null, body: IncomeRequest): Observable<IncomeResponse> {
    const request$ = id ? this.api.update(id, body) : this.api.create(body);
    return request$.pipe(tap(() => this.load()));
  }

  remove(id: string): Observable<void> {
    return this.api.remove(id).pipe(tap(() => this.load()));
  }
}
