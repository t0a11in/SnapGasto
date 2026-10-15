import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminExpense, AdminExpensePayload, AdminUser, Category } from '../../core/models/api.models';
import { AdminApiService } from '../../core/services/admin-api.service';

function currentDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-expenses-page',
  imports: [ReactiveFormsModule],
  templateUrl: './expenses-page.component.html'
})
export class ExpensesPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly api = inject(AdminApiService);

  readonly expenses = signal<AdminExpense[]>([]);
  readonly users = signal<AdminUser[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editing = signal<AdminExpense | null | undefined>(undefined);
  readonly form = this.formBuilder.group({
    userId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    category: ['', [Validators.required, Validators.maxLength(80)]],
    date: [currentDate(), Validators.required],
    paymentMethod: ['Tarjeta', [Validators.required, Validators.maxLength(60)]],
    description: ['', Validators.maxLength(500)]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ expenses: this.api.expenses(), users: this.api.users(), categories: this.api.categories() }).subscribe({
      next: ({ expenses, users, categories }) => {
        this.expenses.set(expenses);
        this.users.set(users);
        this.categories.set(categories);
      },
      error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
      complete: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.message.set('');
    this.editing.set(null);
    this.form.reset({
      userId: this.users()[0]?.id ?? '',
      amount: 0,
      category: this.categories()[0]?.name ?? '',
      date: currentDate(),
      paymentMethod: 'Tarjeta',
      description: ''
    });
  }

  openEdit(expense: AdminExpense): void {
    this.message.set('');
    this.editing.set(expense);
    this.form.reset({
      userId: expense.userId,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      description: expense.description ?? ''
    });
  }

  closeModal(): void { this.editing.set(undefined); }

  save(): void {
    const editing = this.editing();
    if (editing === undefined || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: AdminExpensePayload = {
      userId: value.userId,
      amount: value.amount,
      category: value.category.trim(),
      date: value.date,
      paymentMethod: value.paymentMethod.trim(),
      description: value.description.trim() || null
    };
    this.saving.set(true);
    const request = editing ? this.api.updateExpense(editing.id, payload) : this.api.createExpense(payload);
    request.subscribe({
      next: () => {
        this.message.set('Gasto guardado correctamente.');
        this.closeModal();
        this.load();
      },
      error: (error: Error) => { this.message.set(error.message); this.saving.set(false); },
      complete: () => this.saving.set(false)
    });
  }

  remove(expense: AdminExpense): void {
    if (!confirm(`¿Eliminar el gasto de ${expense.userName}?`)) return;
    this.api.deleteExpense(expense.id).subscribe({
      next: () => { this.message.set('Gasto eliminado.'); this.load(); },
      error: (error: Error) => this.message.set(error.message)
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  }
}
