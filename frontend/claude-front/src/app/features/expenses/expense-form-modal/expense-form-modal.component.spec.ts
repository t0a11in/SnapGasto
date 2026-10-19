import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { todayIso, shiftMonth, currentMonth } from '../../../core/utils/date.utils';
import { ExpensesStore } from '../expenses.store';
import { ExpenseFormModalComponent } from './expense-form-modal.component';

describe('ExpenseFormModalComponent', () => {
  let component: ExpenseFormModalComponent;
  let active: jasmine.SpyObj<NgbActiveModal>;
  let store: { save: jasmine.Spy; month: unknown; knownCategories: unknown };

  beforeEach(async () => {
    active = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', ['close', 'dismiss']);
    store = {
      save: jasmine.createSpy('save'),
      month: signal('2026-10'),
      knownCategories: signal<string[]>(['Comida']),
    };
    await TestBed.configureTestingModule({
      imports: [ExpenseFormModalComponent],
      providers: [{ provide: NgbActiveModal, useValue: active }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseFormModalComponent);
    component = fixture.componentInstance;
    component.configure(store as unknown as ExpensesStore, null);
    fixture.detectChanges();
  });

  const submit = () => component.onSubmit(new Event('submit', { cancelable: true }));

  it('rechaza monto <= 0 y fecha futura', async () => {
    const future = `${shiftMonth(currentMonth(), 1)}-01`;
    component.model.set({ amount: 0, category: 'Comida', date: future, description: '', paymentMethod: 'TARJETA' });
    await submit();
    expect(store.save).not.toHaveBeenCalled();
    expect(component.expenseForm.amount().errors()[0].kind).toBe('positive');
    expect(component.expenseForm.date().errors()[0].kind).toBe('futureDate');
  });

  it('envía ExpenseRequest con descripción opcional como null', async () => {
    store.save.and.returnValue(of({} as never));
    const today = todayIso();
    component.model.set({ amount: 1500, category: 'Comida', date: today, description: '  ', paymentMethod: 'EFECTIVO' });
    await submit();
    expect(store.save).toHaveBeenCalledWith(null, {
      amount: 1500,
      category: 'Comida',
      date: today,
      description: null,
      paymentMethod: 'EFECTIVO',
    });
    expect(active.close).toHaveBeenCalledWith(true);
  });

  it('acepta una categoría nueva escrita a mano', async () => {
    store.save.and.returnValue(of({} as never));
    component.model.set({ amount: 900, category: '  Mascotas ', date: todayIso(), description: '', paymentMethod: 'OTRO' });
    await submit();
    expect(store.save.calls.mostRecent().args[1].category).toBe('Mascotas');
  });

  it('al editar conserva una categoría que ya no existe en la lista', () => {
    component.configure(store as unknown as ExpensesStore, {
      id: '9', amount: 10, category: 'Antigua', date: '2026-10-01', description: null, paymentMethod: 'RARO',
    });
    expect(component.categoryOptions()).toEqual(['Antigua', 'Comida']);
    expect(component.model().paymentMethod).toBe('OTRO');
    expect(component.editingId()).toBe('9');
  });
});
