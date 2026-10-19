import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Income, IncomeMonthlySummary } from '../../core/models/income.models';
import { IncomeApiService } from '../../core/services/income-api.service';
import { IncomesPageComponent } from './incomes-page.component';

describe('IncomesPageComponent', () => {
  const income: Income = {
    id: 'income-1',
    amount: 15000,
    type: 'TARJETA',
    date: '2026-10-16',
    description: 'Sueldo',
  };
  const summary: IncomeMonthlySummary = {
    month: '2026-10',
    totalTarjeta: 15000,
    totalFisico: 0,
    total: 15000,
  };
  const api = jasmine.createSpyObj<IncomeApiService>('IncomeApiService', [
    'list',
    'summary',
    'create',
    'update',
    'delete',
  ]);

  beforeEach(async () => {
    api.list.calls.reset();
    api.summary.calls.reset();
    api.list.and.returnValue(of([income]));
    api.summary.and.returnValue(of(summary));

    await TestBed.configureTestingModule({
      imports: [IncomesPageComponent],
      providers: [{ provide: IncomeApiService, useValue: api }],
    }).compileComponents();
  });

  it('loads the income list and summary for the current month', () => {
    const fixture = TestBed.createComponent(IncomesPageComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(api.list).toHaveBeenCalledWith(component.currentMonth);
    expect(api.summary).toHaveBeenCalledWith(component.currentMonth);
    expect(component.incomes()).toEqual([income]);
    expect(component.summary()).toEqual(summary);
    expect(component.loading()).toBeFalse();
  });

  it('reloads data and initializes a new income for the selected month', () => {
    const fixture = TestBed.createComponent(IncomesPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.changeMonth('2026-09');
    component.openCreate();

    expect(api.list.calls.mostRecent().args).toEqual(['2026-09']);
    expect(api.summary.calls.mostRecent().args).toEqual(['2026-09']);
    expect(component.editing()).toBeNull();
    expect(component.form.getRawValue()).toEqual({
      amount: 0,
      type: 'TARJETA',
      date: '2026-09-01',
      description: '',
    });
  });

  it('opens the create modal when the user clicks Nuevo ingreso', () => {
    const fixture = TestBed.createComponent(IncomesPageComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.panel-actions .button-primary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
