import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { INCOME_TYPES, IncomeResponse } from '../../../../core/models';
import { IconComponent } from '../../../../shared/icons/icon.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

const TYPE_LABELS = new Map<string, string>(INCOME_TYPES.map((t) => [t.value, t.label]));

@Component({
  selector: 'app-incomes-table',
  imports: [DatePipe, IconComponent, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incomes-table.component.html',
})
export class IncomesTableComponent {
  readonly items = input.required<readonly IncomeResponse[]>();
  readonly loading = input(false);
  readonly caption = input('Ingresos');
  readonly edit = output<IncomeResponse>();
  readonly remove = output<IncomeResponse>();

  typeLabel(type: string): string {
    return TYPE_LABELS.get(type) ?? type;
  }
}
