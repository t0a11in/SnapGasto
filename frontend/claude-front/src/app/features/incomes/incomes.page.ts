import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../core/http/error.utils';
import { IncomeResponse } from '../../core/models';
import { ConfirmService } from '../../shared/components/confirm.service';
import { MonthPickerComponent } from '../../shared/components/month-picker.component';
import { ToastService } from '../../shared/components/toast.service';
import { IconComponent } from '../../shared/icons/icon.component';
import { MonthBalanceComponent } from '../../shared/components/month-balance/month-balance.component';
import { IncomeSummaryCardsComponent } from './components/income-summary-cards/income-summary-cards.component';
import { IncomesTableComponent } from './components/incomes-table/incomes-table.component';
import { IncomeFormModalComponent } from './income-form-modal/income-form-modal.component';
import { IncomesStore } from './incomes.store';

@Component({
  selector: 'app-incomes-page',
  imports: [MonthPickerComponent, IconComponent, IncomeSummaryCardsComponent, IncomesTableComponent, MonthBalanceComponent],
  providers: [IncomesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incomes.page.html',
})
export class IncomesPage {
  readonly store = inject(IncomesStore);
  private readonly modal = inject(NgbModal);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  constructor() {
    this.store.load();
    this.store.loadBalance();
  }

  openForm(income: IncomeResponse | null = null): void {
    const ref = this.modal.open(IncomeFormModalComponent, { ariaLabelledBy: 'income-modal-title' });
    (ref.componentInstance as IncomeFormModalComponent).configure(this.store, income);
    ref.result.then(
      () => this.toast.success(income ? 'Ingreso actualizado.' : 'Ingreso registrado.'),
      () => undefined,
    );
  }

  async remove(income: IncomeResponse): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Eliminar ingreso',
      message: '¿Seguro que quieres eliminar este ingreso? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
    });
    if (!ok) {
      return;
    }
    try {
      await firstValueFrom(this.store.remove(income.id), { defaultValue: undefined });
      this.toast.success('Ingreso eliminado.');
    } catch (err) {
      this.toast.error(errorMessage(err));
    }
  }
}
