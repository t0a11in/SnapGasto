import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { errorMessage } from '../../../core/http/error.utils';
import {
  AdminExpenseRequest,
  AdminExpenseResponse,
  AdminUserResponse,
  CategoryResponse,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../../../core/models';
import { todayIso } from '../../../core/utils/date.utils';
import { CategoryAutocompleteComponent } from '../../../shared/components/category-autocomplete/category-autocomplete.component';
import { FieldErrorsComponent } from '../../../shared/components/field-errors.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { notFutureDate, optionalText, positiveAmount } from '../../../shared/forms/common-validators';
import { AdminResourceStore } from '../shared/admin-resource.store';

interface AdminExpenseFormModel {
  userId: string;
  amount: number | null;
  category: string;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
}

export interface AdminExpenseModalContext {
  store: AdminResourceStore<AdminExpenseRequest, AdminExpenseResponse>;
  users: readonly AdminUserResponse[];
  categories: readonly CategoryResponse[];
}

const isPaymentMethod = (v: string): v is PaymentMethod => PAYMENT_METHODS.some((p) => p.value === v);

@Component({
  selector: 'app-admin-expense-form-modal',
  imports: [FormField, FieldErrorsComponent, CategoryAutocompleteComponent, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-expense-form-modal.component.html',
})
export class AdminExpenseFormModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  private ctx: AdminExpenseModalContext | null = null;

  readonly paymentMethods = PAYMENT_METHODS;
  readonly today = todayIso();
  readonly editingId = signal<string | null>(null);
  readonly serverError = signal<string | null>(null);
  readonly users = signal<readonly AdminUserResponse[]>([]);
  private readonly categoryNames = signal<string[]>([]);
  private readonly originalCategory = signal<string | null>(null);
  readonly categoryOptions = computed(() => {
    const names = this.categoryNames();
    const original = this.originalCategory();
    return original && !names.includes(original) ? [original, ...names] : names;
  });

  readonly model = signal<AdminExpenseFormModel>({
    userId: '',
    amount: null,
    category: '',
    date: this.today,
    description: '',
    paymentMethod: 'TARJETA',
  });
  readonly expenseForm = form(this.model, (p) => {
    required(p.userId, { message: 'Selecciona el usuario.' });
    positiveAmount(p.amount);
    required(p.category, { message: 'Indica la categoría.' });
    maxLength(p.category, 80, { message: 'Máximo 80 caracteres.' });
    notFutureDate(p.date);
    maxLength(p.description, 500, { message: 'Máximo 500 caracteres.' });
    required(p.paymentMethod);
  });

  configure(ctx: AdminExpenseModalContext, e: AdminExpenseResponse | null): void {
    this.ctx = ctx;
    this.users.set([...ctx.users].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    this.categoryNames.set(ctx.categories.map((c) => c.name).sort((a, b) => a.localeCompare(b)));
    this.editingId.set(e?.id ?? null);
    this.originalCategory.set(e?.category ?? null);
    this.model.set(
      e
        ? {
            userId: e.userId,
            amount: Number(e.amount),
            category: e.category,
            date: e.date,
            description: e.description ?? '',
            paymentMethod: isPaymentMethod(e.paymentMethod) ? e.paymentMethod : 'OTRO',
          }
        : { userId: '', amount: null, category: '', date: this.today, description: '', paymentMethod: 'TARJETA' },
    );
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.serverError.set(null);
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    await submit(this.expenseForm, async () => {
      const m = this.model();
      try {
        await firstValueFrom(
          ctx.store.save(this.editingId(), {
            userId: m.userId,
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
