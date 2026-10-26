import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MoneyPipe, Percent1Pipe } from '../../pipes/money.pipe';
import { IconComponent } from '../icon/icon.component';

/** Diferencia del mes: ingresos − gastos, con la proporción gastada. */
@Component({
  selector: 'app-month-balance',
  imports: [MoneyPipe, Percent1Pipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-balance.component.html',
  styleUrl: './month-balance.component.scss',
})
export class MonthBalanceComponent {
  /** null = aún cargando o no disponible. */
  readonly income = input<number | null>(null);
  readonly expense = input<number | null>(null);

  readonly ready = computed(() => this.income() !== null && this.expense() !== null);
  readonly balance = computed(() => (this.income() ?? 0) - (this.expense() ?? 0));
  readonly positive = computed(() => this.balance() >= 0);
  readonly absBalance = computed(() => Math.abs(this.balance()));
  /** Proporción de los ingresos ya gastada (0..1+). */
  readonly spentRatio = computed(() => {
    const income = this.income() ?? 0;
    return income > 0 ? (this.expense() ?? 0) / income : this.expense() ? 1 : 0;
  });
  readonly barWidth = computed(() => Math.min(100, this.spentRatio() * 100));
}
