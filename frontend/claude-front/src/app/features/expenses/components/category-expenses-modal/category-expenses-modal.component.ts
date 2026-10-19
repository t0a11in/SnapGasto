import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpenseResponse } from '../../../../core/models';
import { sumAmounts } from '../../../../core/utils/money.utils';
import { MoneyPipe, ThousandsPipe } from '../../../../shared/pipes/money.pipe';
import { ExpensesTableComponent } from '../expenses-table/expenses-table.component';

/** Detalle de todos los gastos del mes de una categoría. */
@Component({
  selector: 'app-category-expenses-modal',
  imports: [ExpensesTableComponent, MoneyPipe, ThousandsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-expenses-modal.component.html',
})
export class CategoryExpensesModalComponent {
  readonly activeModal = inject(NgbActiveModal);

  readonly category = signal('');
  readonly month = signal('');
  readonly items = signal<readonly ExpenseResponse[]>([]);
  readonly total = computed(() => sumAmounts(this.items()));

  configure(category: string, month: string, items: readonly ExpenseResponse[]): void {
    this.category.set(category);
    this.month.set(month);
    this.items.set(items);
  }
}
