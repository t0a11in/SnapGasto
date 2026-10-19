import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { CategoryTotal } from '../../expenses.store';
import { CategoryBreakdownComponent } from '../category-breakdown/category-breakdown.component';

/** Todas las categorías del mes. Cierra con el nombre de la categoría elegida. */
@Component({
  selector: 'app-categories-overview-modal',
  imports: [CategoryBreakdownComponent, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categories-overview-modal.component.html',
})
export class CategoriesOverviewModalComponent {
  readonly activeModal = inject(NgbActiveModal);
  readonly rows = signal<readonly CategoryTotal[]>([]);
  readonly colors = signal<ReadonlyMap<string, string>>(new Map());
  readonly month = signal('');
  readonly total = signal(0);

  configure(rows: readonly CategoryTotal[], colors: ReadonlyMap<string, string>, month: string, total: number): void {
    this.rows.set(rows);
    this.colors.set(colors);
    this.month.set(month);
    this.total.set(total);
  }
}
