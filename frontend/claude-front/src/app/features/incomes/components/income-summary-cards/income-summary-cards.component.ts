import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IncomeMonthlySummaryResponse } from '../../../../core/models';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-income-summary-cards',
  imports: [MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './income-summary-cards.component.html',
})
export class IncomeSummaryCardsComponent {
  readonly summary = input<IncomeMonthlySummaryResponse | null>(null);
}
