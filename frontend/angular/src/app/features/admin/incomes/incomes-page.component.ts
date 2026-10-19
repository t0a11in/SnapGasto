import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { IncomeApiService } from '../../../core/services/income-api.service';
import { Income, IncomeMonthlySummary, IncomePayload, IncomeType } from '../../../core/models/income.models';

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-incomes-page',
  imports: [ReactiveFormsModule],
  templateUrl: './incomes-page.component.html'
})
export class IncomesPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly api = inject(IncomeApiService);

  readonly maximumDate = today();
  readonly currentMonth = this.maximumDate.slice(0, 7);
  readonly incomes = signal<Income[]>([]);
  readonly summary = signal<IncomeMonthlySummary | null>(null);
  readonly selectedMonth = signal(this.currentMonth);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editing = signal<Income | null | undefined>(undefined);
  readonly form = this.formBuilder.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['TARJETA' as IncomeType, Validators.required],
    date: [this.maximumDate, Validators.required],
    description: ['', Validators.maxLength(500)]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const month = this.selectedMonth();
    this.loading.set(true);
    this.error.set('');
    forkJoin({ incomes: this.api.list(month), summary: this.api.summary(month) }).subscribe({
      next: ({ incomes, summary }) => {
        this.incomes.set(incomes);
        this.summary.set(summary);
      },
      error: (error: Error) => {
        this.error.set(error.message);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  changeMonth(month: string): void {
    this.selectedMonth.set(month || this.currentMonth);
    this.load();
  }

  openCreate(): void {
    this.message.set('');
    this.editing.set(null);
    this.form.reset({
      amount: 0,
      type: 'TARJETA',
      date: this.defaultDateForSelectedMonth(),
      description: ''
    });
  }

  openEdit(income: Income): void {
    this.message.set('');
    this.editing.set(income);
    this.form.reset({
      amount: income.amount,
      type: income.type,
      date: income.date,
      description: income.description ?? ''
    });
  }

  closeModal(): void {
    this.editing.set(undefined);
  }

  save(): void {
    const editing = this.editing();
    if (editing === undefined || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: IncomePayload = {
      amount: Number(value.amount),
      type: value.type,
      date: value.date,
      description: value.description.trim() || null
    };
    this.saving.set(true);
    const request = editing ? this.api.update(editing.id, payload) : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.message.set(editing ? 'Ingreso actualizado correctamente.' : 'Ingreso registrado correctamente.');
        this.closeModal();
        this.load();
      },
      error: (error: Error) => {
        this.message.set(error.message);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false)
    });
  }

  remove(income: Income): void {
    if (!confirm(`¿Eliminar el ingreso de ${this.formatAmount(income.amount)}?`)) return;
    this.api.delete(income.id).subscribe({
      next: () => {
        this.message.set('Ingreso eliminado.');
        this.load();
      },
      error: (error: Error) => this.message.set(error.message)
    });
  }

  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  }

  typeLabel(type: IncomeType): string {
    return type === 'TARJETA' ? 'Tarjeta' : 'Físico';
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  }

  private defaultDateForSelectedMonth(): string {
    return this.selectedMonth() === this.currentMonth ? this.maximumDate : `${this.selectedMonth()}-01`;
  }
}
