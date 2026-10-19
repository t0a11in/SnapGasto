import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Expense } from '../../core/models/expense.models';
import { ExpenseApiService } from '../../core/services/expense-api.service';
import { ExpensesPageComponent } from './expenses-page.component';

describe('ExpensesPageComponent', () => {
  const expense: Expense = {
    id: 'expense-1',
    amount: 15990,
    category: 'Alimentación',
    date: '2026-10-18',
    description: 'Compra semanal',
    paymentMethod: 'TARJETA',
  };
  const api = jasmine.createSpyObj<ExpenseApiService>('ExpenseApiService', ['list', 'create', 'update', 'delete']);

  beforeEach(async () => {
    api.list.calls.reset();
    api.create.calls.reset();
    api.update.calls.reset();
    api.delete.calls.reset();
    api.list.and.returnValue(of([expense]));
    api.create.and.returnValue(of(expense));

    await TestBed.configureTestingModule({
      imports: [ExpensesPageComponent],
      providers: [{ provide: ExpenseApiService, useValue: api }],
    }).compileComponents();
  });

  it('loads the expenses for the current month and computes their total', () => {
    const fixture = TestBed.createComponent(ExpensesPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(api.list).toHaveBeenCalledWith(component.currentMonth);
    expect(component.expenses()).toEqual([expense]);
    expect(component.total()).toBe(15990);
  });

  it('uses the selected month when creating a new expense', () => {
    const fixture = TestBed.createComponent(ExpensesPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.changeMonth('2026-09');
    component.openCreate();

    expect(api.list.calls.mostRecent().args).toEqual(['2026-09']);
    expect(component.editing()).toBeNull();
    expect(component.expenseModel()).toEqual({
      amount: 0,
      category: '',
      date: '2026-09-01',
      description: '',
      paymentMethod: 'TARJETA',
    });
  });

  it('opens the create modal when the user clicks Nuevo gasto', () => {
    const fixture = TestBed.createComponent(ExpensesPageComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.panel-actions .button-primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('creates a valid expense from the signal form model', () => {
    const fixture = TestBed.createComponent(ExpensesPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.openCreate();
    component.expenseModel.set({
      amount: 15990,
      category: 'Alimentación',
      date: component.maximumDate,
      description: 'Compra semanal',
      paymentMethod: 'TARJETA',
    });

    component.save();

    expect(api.create).toHaveBeenCalledWith({
      amount: 15990,
      category: 'Alimentación',
      date: component.maximumDate,
      description: 'Compra semanal',
      paymentMethod: 'TARJETA',
    });
    expect(component.editing()).toBeUndefined();
  });
});
