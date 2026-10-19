import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../core/http/error.utils';
import { ExpenseResponse } from '../../core/models';
import { ConfirmService } from '../../shared/components/confirm.service';
import { MonthPickerComponent } from '../../shared/components/month-picker.component';
import { ToastService } from '../../shared/components/toast.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { MonthBalanceComponent } from '../../shared/components/month-balance/month-balance.component';
import { CategoriesOverviewModalComponent } from './components/categories-overview-modal/categories-overview-modal.component';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown.component';
import { CategoryExpensesModalComponent } from './components/category-expenses-modal/category-expenses-modal.component';
import { ExpenseDistributionChartComponent } from './components/expense-distribution-chart/expense-distribution-chart.component';
import { ExpenseSummaryCardComponent } from './components/expense-summary-card/expense-summary-card.component';
import { ExpensesTableComponent } from './components/expenses-table/expenses-table.component';
import { ExpenseFormModalComponent } from './expense-form-modal/expense-form-modal.component';
import { ExpensesStore } from './expenses.store';

/** Página contenedora: coordina store, modales y componentes de presentación. */
@Component({
  selector: 'app-expenses-page',
  imports: [
    MonthPickerComponent,
    IconComponent,
    ExpenseSummaryCardComponent,
    CategoryBreakdownComponent,
    ExpensesTableComponent,
    ExpenseDistributionChartComponent,
    MonthBalanceComponent,
  ],
  providers: [ExpensesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expenses.page.html',
})
export class ExpensesPage {
  readonly store = inject(ExpensesStore);
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  constructor() {
    this.store.load();
    this.store.loadBalance();
    this.store.loadCategories();
  }

  openForm(expense: ExpenseResponse | null = null): void {
    const ref = this.modal.open(ExpenseFormModalComponent, { ariaLabelledBy: 'expense-modal-title' });
    (ref.componentInstance as ExpenseFormModalComponent).configure(this.store, expense);
    ref.result.then(
      () => this.toast.success(expense ? 'Gasto actualizado.' : 'Gasto registrado.'),
      () => undefined,
    );
  }

  openCategory(category: string): void {
    const ref = this.modal.open(CategoryExpensesModalComponent, {
      size: 'lg',
      scrollable: true,
      ariaLabelledBy: 'category-expenses-title',
    });
    (ref.componentInstance as CategoryExpensesModalComponent).configure(
      category,
      this.store.month(),
      this.store.itemsOfCategory(category),
    );
  }

  /** Modal con todas las categorías; al elegir una se abre su detalle. */
  openAllCategories(): void {
    const ref = this.modal.open(CategoriesOverviewModalComponent, {
      scrollable: true,
      ariaLabelledBy: 'categories-overview-title',
    });
    (ref.componentInstance as CategoriesOverviewModalComponent).configure(
      this.store.byCategory(),
      this.store.categoryColors(),
      this.store.month(),
      this.store.total(),
    );
    ref.result.then(
      (category: unknown) => {
        if (typeof category === 'string' && category) {
          this.openCategory(category);
        }
      },
      () => undefined,
    );
  }

  async remove(expense: ExpenseResponse): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar gasto',
      message: '¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    try {
      await firstValueFrom(this.store.remove(expense.id), { defaultValue: undefined });
      this.toast.success('Gasto eliminado.');
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }
}
