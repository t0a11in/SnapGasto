import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MoneyPipe, Percent1Pipe } from '../../../../shared/pipes/money.pipe';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { CategoryTotal } from '../../expenses.store';

/** Alto fijo de cada fila (rem): permite calcular cuántas filas se ven antes del scroll. */
export const BREAKDOWN_ROW_REM = 2.5;

/**
 * Lista de gastos por categoría. Muestra `visibleRows` filas y el resto con scroll;
 * el botón "Ver todas" pide abrir el detalle completo. Cada fila abre sus gastos.
 */
@Component({
  selector: 'app-category-breakdown',
  imports: [MoneyPipe, Percent1Pipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-breakdown.component.html',
  styleUrl: './category-breakdown.component.scss',
})
export class CategoryBreakdownComponent {
  readonly rows = input.required<readonly CategoryTotal[]>();
  /** Filas visibles antes del scroll; null = sin límite (p. ej. dentro de un modal). */
  readonly visibleRows = input<number | null>(3);
  readonly showHeader = input(true);
  /** Colores por categoría (mismos del gráfico de torta). */
  readonly colors = input<ReadonlyMap<string, string>>(new Map());

  readonly selectCategory = output<string>();
  readonly expand = output<void>();

  readonly maxHeight = computed(() => {
    const n = this.visibleRows();
    return n === null ? null : n * BREAKDOWN_ROW_REM;
  });
  readonly hasMore = computed(() => {
    const n = this.visibleRows();
    return n !== null && this.rows().length > n;
  });

  color(row: CategoryTotal): string {
    return this.colors().get(row.category) ?? row.colorHex ?? 'var(--bs-secondary)';
  }
}
