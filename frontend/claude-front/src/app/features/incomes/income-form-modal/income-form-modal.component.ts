import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { INCOME_TYPES, IncomeResponse, IncomeType } from '../../../core/models';
import { defaultDateForMonth, todayIso } from '../../../core/utils/date.utils';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { notFutureDate, optionalText, positiveAmount } from '../../../shared/forms/common-validators';
import { IncomesStore } from '../incomes.store';

interface IncomeFormModel {
  amount: number | null;
  type: IncomeType;
  date: string;
  description: string;
}

@Component({
  selector: 'app-income-form-modal',
  imports: [FormField, MoneyPipe, FieldErrorsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './income-form-modal.component.html',
})
export class IncomeFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private store!: IncomesStore;

  readonly types = INCOME_TYPES;
  readonly today = todayIso();
  readonly editingId = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);

  readonly model = signal<IncomeFormModel>({ amount: null, type: 'TARJETA', date: this.today, description: '' });
  readonly incomeForm = form(this.model, (p) => {
    positiveAmount(p.amount);
    required(p.type, { message: 'Selecciona el tipo.' });
    notFutureDate(p.date);
    maxLength(p.description, 500, { message: 'Máximo 500 caracteres.' });
  });

  /** Configura el modal antes de mostrarse (crear o editar). */
  configure(store: IncomesStore, income: IncomeResponse | null): void {
    this.store = store;
    this.editingId.set(income?.id ?? null);
    this.model.set(
      income
        ? {
            amount: Number(income.amount),
            type: income.type,
            date: income.date,
            description: income.description ?? '',
          }
        : { amount: null, type: 'TARJETA', date: defaultDateForMonth(store.month()), description: '' },
    );
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    await submit(this.incomeForm, async () => {
      const m = this.model();
      try {
        await firstValueFrom(
          this.store.save(this.editingId(), {
            amount: Number(m.amount),
            type: m.type,
            date: m.date,
            description: optionalText(m.description),
          }),
        );
        this.activeModal.close(true);
      } catch (err) {
        this.serverError.set(errorMessage(err));
      }
      return undefined;
    });
  }
}
