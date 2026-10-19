import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild } from '@angular/core';
import { OTHER_COLOR } from '../../../../core/utils/chart-palette';
import { MoneyPipe, Percent1Pipe, ThousandsPipe } from '../../../../shared/pipes/money.pipe';
import { CategoryTotal, OTHER_CATEGORY } from '../../expenses.store';

export interface PieSlice {
  row: CategoryTotal;
  color: string;
  /** Path SVG del sector (null si ocupa el 100 %: se dibuja un círculo). */
  path: string | null;
  /** Desplazamiento hacia afuera al resaltar. */
  dx: number;
  dy: number;
}

const CX = 100;
const CY = 100;
const R = 92;
const POP = 5;

function point(angle: number, r = R): [number, number] {
  // 0 rad = arriba, sentido horario.
  return [CX + r * Math.sin(angle), CY - r * Math.cos(angle)];
}

/**
 * Torta de distribución del gasto mensual por categoría.
 * Sectores en orden de mayor a menor con la paleta categórica validada, separación
 * de 2px, leyenda con montos y porcentajes, y tooltip al pasar el mouse.
 * Clic en un sector/leyenda abre los gastos de esa categoría ("Otras" abre el listado completo).
 */
@Component({
  selector: 'app-expense-distribution-chart',
  imports: [MoneyPipe, Percent1Pipe, ThousandsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expense-distribution-chart.component.html',
  styleUrl: './expense-distribution-chart.component.scss',
})
export class ExpenseDistributionChartComponent {
  readonly rows = input.required<readonly CategoryTotal[]>();
  readonly colors = input<ReadonlyMap<string, string>>(new Map());
  readonly total = input.required<number>();
  readonly month = input('');
  readonly selectCategory = output<string>();
  readonly showAll = output<void>();

  readonly otherLabel = OTHER_CATEGORY;
  private readonly plot = viewChild<ElementRef<HTMLElement>>('plot');

  readonly active = signal<string | null>(null);
  readonly tooltip = signal<{ slice: PieSlice; x: number; y: number } | null>(null);

  readonly slices = computed<PieSlice[]>(() => {
    const rows = this.rows();
    const sum = rows.reduce((a, r) => a + r.total, 0);
    if (sum <= 0) {
      return [];
    }
    let start = 0;
    return rows.map((row) => {
      const fraction = row.total / sum;
      const end = start + fraction * Math.PI * 2;
      const mid = (start + end) / 2;
      const color = this.colors().get(row.category) ?? (row.category === OTHER_CATEGORY ? OTHER_COLOR : '#2a78d6');
      let path: string | null = null;
      if (fraction < 0.9999) {
        const [x1, y1] = point(start);
        const [x2, y2] = point(end);
        const large = end - start > Math.PI ? 1 : 0;
        path = `M ${CX} ${CY} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
      }
      const slice: PieSlice = {
        row,
        color,
        path,
        dx: path ? POP * Math.sin(mid) : 0,
        dy: path ? -POP * Math.cos(mid) : 0,
      };
      start = end;
      return slice;
    });
  });

  readonly activeSlice = computed(() => this.slices().find((s) => s.row.category === this.active()) ?? null);

  highlight(slice: PieSlice, event?: MouseEvent): void {
    this.active.set(slice.row.category);
    const host = this.plot()?.nativeElement;
    if (event && host) {
      const box = host.getBoundingClientRect();
      this.tooltip.set({ slice, x: event.clientX - box.left, y: event.clientY - box.top });
    }
  }

  clear(): void {
    this.active.set(null);
    this.tooltip.set(null);
  }

  open(slice: PieSlice): void {
    if (slice.row.category === OTHER_CATEGORY) {
      this.showAll.emit();
    } else {
      this.selectCategory.emit(slice.row.category);
    }
  }

  transform(slice: PieSlice): string | null {
    return this.active() === slice.row.category ? `translate(${slice.dx.toFixed(2)} ${slice.dy.toFixed(2)})` : null;
  }
}
