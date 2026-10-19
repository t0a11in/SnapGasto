import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExpenseResponse, PAYMENT_METHODS } from '../../../../core/models';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

const PM_LABELS = new Map<string, string>(PAYMENT_METHODS.map((p) => [p.value, p.label]));

@Component({
  selector: 'app-expenses-table',
  imports: [DatePipe, IconComponent, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expenses-table.component.html',
})
export class ExpensesTableComponent {
  readonly items = input.required<readonly ExpenseResponse[]>();
  readonly loading = input(false);
  readonly caption = input('Gastos');
  /** false oculta editar/eliminar (p. ej. en el modal de detalle). */
  readonly showActions = input(true);
  readonly showCategory = input(true);

  readonly edit = output<ExpenseResponse>();
  readonly remove = output<ExpenseResponse>();

  paymentLabel(value: string): string {
    return PM_LABELS.get(value) ?? value;
  }

  columns(): number {
    return 4 + (this.showCategory() ? 1 : 0) + (this.showActions() ? 1 : 0);
  }
}
