import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, min, required } from '@angular/forms/signals';
import { Expense, ExpensePayload } from '../../core/models/expense.models';
import { ExpenseApiService } from '../../core/services/expense-api.service';

interface ExpenseFormValue extends Omit<ExpensePayload, 'description'> {
  description: string;
}

const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Servicios',
  'Otros',
] as const;

const PAYMENT_METHODS = [
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'OTRO', label: 'Otro' },
] as const;

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-personal-expenses-page',
  imports: [FormField],
  templateUrl: './expenses-page.component.html',
})
export class ExpensesPageComponent {
  private readonly api = inject(ExpenseApiService);

  readonly categories = EXPENSE_CATEGORIES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly maximumDate = today();
  readonly currentMonth = this.maximumDate.slice(0, 7);
  readonly expenses = signal<Expense[]>([]);
  readonly selectedMonth = signal(this.currentMonth);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editing = signal<Expense | null | undefined>(undefined);
  readonly expenseModel = signal<ExpenseFormValue>(this.emptyExpense());
  readonly expenseForm = form(this.expenseModel, (schemaPath) => {
    required(schemaPath.amount, { message: 'Ingresa el monto del gasto.' });
    min(schemaPath.amount, 0.01, { message: 'El monto debe ser mayor a cero.' });
    required(schemaPath.category, { message: 'Selecciona o escribe una categoría.' });
    maxLength(schemaPath.category, 80, { message: 'La categoría puede tener hasta 80 caracteres.' });
    required(schemaPath.date, { message: 'Selecciona la fecha del gasto.' });
    required(schemaPath.paymentMethod, { message: 'Selecciona el medio de pago.' });
    maxLength(schemaPath.description, 500, { message: 'La descripción puede tener hasta 500 caracteres.' });
  });
  readonly total = computed(() => this.expenses().reduce((sum, expense) => sum + expense.amount, 0));
  readonly canSave = computed(() => this.expenseForm().valid() && Boolean(this.expenseModel().category.trim()));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.selectedMonth()).subscribe({
      next: (expenses) => {
        this.expenses.set(expenses);
        this.loading.set(false);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
    });
  }

  changeMonth(month: string): void {
    this.selectedMonth.set(month || this.currentMonth);
    this.load();
  }

  openCreate(): void {
    this.message.set('');
    this.editing.set(null);
    this.expenseModel.set(this.emptyExpense());
    this.expenseForm().reset();
  }

  openEdit(expense: Expense): void {
    this.message.set('');
    this.editing.set(expense);
    this.expenseModel.set({
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description ?? '',
      paymentMethod: expense.paymentMethod,
    });
    this.expenseForm().reset();
  }

  closeModal(): void {
    this.editing.set(undefined);
  }

  save(): void {
    const editing = this.editing();
    if (editing === undefined || !this.canSave()) {
      this.markFormAsTouched();
      return;
    }

    const value = this.expenseModel();
    const payload: ExpensePayload = {
      ...value,
      amount: Number(value.amount),
      category: value.category.trim(),
      description: value.description.trim() || null,
    };
    this.saving.set(true);
    const request = editing ? this.api.update(editing.id, payload) : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.message.set(editing ? 'Gasto actualizado correctamente.' : 'Gasto registrado correctamente.');
        this.closeModal();
        this.load();
      },
      error: (error: Error) => {
        this.message.set(error.message);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  remove(expense: Expense): void {
    if (!confirm(`¿Eliminar el gasto de ${this.formatAmount(expense.amount)}?`)) return;
    this.api.delete(expense.id).subscribe({
      next: () => {
        this.message.set('Gasto eliminado.');
        this.load();
      },
      error: (error: Error) => this.message.set(error.message),
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  }

  paymentMethodLabel(paymentMethod: Expense['paymentMethod']): string {
    return this.paymentMethods.find((item) => item.value === paymentMethod)?.label ?? paymentMethod;
  }

  private emptyExpense(): ExpenseFormValue {
    return {
      amount: 0,
      category: '',
      date: this.defaultDateForSelectedMonth(),
      description: '',
      paymentMethod: 'TARJETA',
    };
  }

  private defaultDateForSelectedMonth(): string {
    return this.selectedMonth() === this.currentMonth ? this.maximumDate : `${this.selectedMonth()}-01`;
  }

  private markFormAsTouched(): void {
    this.expenseForm.amount().markAsTouched();
    this.expenseForm.category().markAsTouched();
    this.expenseForm.date().markAsTouched();
    this.expenseForm.paymentMethod().markAsTouched();
    this.expenseForm.description().markAsTouched();
  }
}
