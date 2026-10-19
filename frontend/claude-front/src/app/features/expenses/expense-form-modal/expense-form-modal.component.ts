import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import { ExpenseResponse, PAYMENT_METHODS, PaymentMethod } from '../../../core/models';
import { defaultDateForMonth, todayIso } from '../../../core/utils/date.utils';
import { CategoryAutocompleteComponent } from '../../../shared/components/category-autocomplete/category-autocomplete.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { notFutureDate, optionalText, positiveAmount } from '../../../shared/forms/common-validators';
import { ExpensesStore } from '../expenses.store';

interface ExpenseFormModel {
  amount: number | null;
  category: string;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
}

const isPaymentMethod = (v: string): v is PaymentMethod => PAYMENT_METHODS.some((p) => p.value === v);

@Component({
  selector: 'app-expense-form-modal',
  imports: [FormField, MoneyPipe, FieldErrorsComponent, CategoryAutocompleteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expense-form-modal.component.html',
})
export class ExpenseFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private readonly store = signal<ExpensesStore | null>(null);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly today = todayIso();
  readonly editingId = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  private readonly originalCategory = signal<string | null>(null);

  /** Sugerencias: catálogo + categorías ya usadas; incluye la original del gasto editado. */
  readonly categoryOptions = computed(() => {
    const names = this.store()?.knownCategories() ?? [];
    const original = this.originalCategory();
    return original && !names.includes(original) ? [original, ...names] : names;
  });

  readonly model = signal<ExpenseFormModel>({
    amount: null,
    category: '',
    date: this.today,
    description: '',
    paymentMethod: 'TARJETA',
  });
  readonly expenseForm = form(this.model, (p) => {
    positiveAmount(p.amount);
    required(p.category, { message: 'Escribe o elige una categoría.' });
    maxLength(p.category, 80, { message: 'Máximo 80 caracteres.' });
    notFutureDate(p.date);
    maxLength(p.description, 500, { message: 'Máximo 500 caracteres.' });
    required(p.paymentMethod, { message: 'Selecciona el medio de pago.' });
  });

  configure(store: ExpensesStore, expense: ExpenseResponse | null): void {
    this.store.set(store);
    this.editingId.set(expense?.id ?? null);
    this.originalCategory.set(expense?.category ?? null);
    this.model.set(
      expense
        ? {
            amount: Number(expense.amount),
            category: expense.category,
            date: expense.date,
            description: expense.description ?? '',
            paymentMethod: isPaymentMethod(expense.paymentMethod) ? expense.paymentMethod : 'OTRO',
          }
        : {
            amount: null,
            category: '',
            date: defaultDateForMonth(store.month()),
            description: '',
            paymentMethod: 'TARJETA',
          },
    );
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    const store = this.store();
    if (!store) {
      return;
    }
    await submit(this.expenseForm, async () => {
      const m = this.model();
      try {
        await firstValueFrom(
          store.save(this.editingId(), {
            amount: Number(m.amount),
            category: m.category.trim(),
            date: m.date,
            description: optionalText(m.description),
            paymentMethod: m.paymentMethod,
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
