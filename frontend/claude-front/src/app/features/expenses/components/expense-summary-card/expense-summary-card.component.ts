import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MoneyPipe, ThousandsPipe } from '../../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-expense-summary-card',
  imports: [MoneyPipe, ThousandsPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expense-summary-card.component.html',
})
export class ExpenseSummaryCardComponent {
  readonly total = input.required<number>();
  readonly count = input.required<number>();
  readonly categories = input(0);
}
