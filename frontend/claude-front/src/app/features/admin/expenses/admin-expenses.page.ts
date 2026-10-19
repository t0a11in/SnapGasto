import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { AdminExpenseResponse, PAYMENT_METHODS } from '../../../core/models';
import {
  AdminCategoriesApiService,
  AdminExpensesApiService,
  AdminUsersApiService,
} from '../../../core/services/admin-api.services';
import { sumAmounts } from '../../../core/utils/money.utils';
import { ConfirmService } from '../../../shared/components/confirm.service';
import { ToastService } from '../../../shared/components/toast.service';
import { IconComponent } from '../../../shared/icons/icon.component';
import { AdminPageHeaderComponent } from '../shared/admin-page-header.component';
import { AdminResourceStore } from '../shared/admin-resource.store';
import { TableStateComponent } from '../shared/table-state.component';
import { AdminExpenseFormModalComponent } from './admin-expense-form-modal.component';

@Component({
  selector: 'app-admin-expenses-page',
  imports: [MoneyPipe, DatePipe, IconComponent, AdminPageHeaderComponent, TableStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-expenses.page.html',
  styleUrl: './admin-expenses.page.scss',
})
export class AdminExpensesPage {
  readonly store = new AdminResourceStore(inject(AdminExpensesApiService));
  readonly users = new AdminResourceStore(inject(AdminUsersApiService));
  readonly categories = new AdminResourceStore(inject(AdminCategoriesApiService));
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly pmLabels = new Map<string, string>(PAYMENT_METHODS.map((p) => [p.value, p.label]));

  readonly userFilter = signal('');
  readonly monthFilter = signal('');
  readonly filtered = computed(() => {
    const user = this.userFilter();
    const month = this.monthFilter();
    return this.store
      .items()
      .filter((e) => (!user || e.userId === user) && (!month || e.date.startsWith(month)))
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  readonly filteredTotal = computed(() => sumAmounts(this.filtered()));

  constructor() {
    this.reload();
  }

  reload(): void {
    this.store.load();
    this.users.load();
    this.categories.load();
  }

  paymentLabel(value: string): string {
    return this.pmLabels.get(value) ?? value;
  }

  openForm(e: AdminExpenseResponse | null = null): void {
    const ref = this.modal.open(AdminExpenseFormModalComponent, { ariaLabelledBy: 'admin-expense-modal-title' });
    (ref.componentInstance as AdminExpenseFormModalComponent).configure(
      { store: this.store, users: this.users.items(), categories: this.categories.items() },
      e,
    );
    ref.result.then(() => {
      this.toast.success(e ? 'Gasto actualizado.' : 'Gasto creado.');
      this.store.load(); // refresca userName calculado por el backend
    }, () => undefined);
  }

  async remove(e: AdminExpenseResponse): Promise<void> {
    if (!(await this.confirm.confirm({ title: 'Eliminar gasto', message: `¿Eliminar el gasto de ${e.userName}?`, confirmText: 'Eliminar' }))) {
      return;
    }
    try {
      await firstValueFrom(this.store.remove(e.id), { defaultValue: undefined });
      this.toast.success('Gasto eliminado.');
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }
}
