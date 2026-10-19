import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { isValidMonth, shiftMonth } from '../../core/utils/date.utils';
import { IconComponent } from '../icons/icon.component';

/** Selector de mes YYYY-MM con navegación anterior/siguiente. */
@Component({
  selector: 'app-month-picker',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-picker.component.html',
  styleUrl: './month-picker.component.scss',
})
export class MonthPickerComponent {
  readonly month = model.required<string>();

  shift(delta: number): void {
    this.month.set(shiftMonth(this.month(), delta));
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (isValidMonth(value)) {
      this.month.set(value);
    }
  }
}
