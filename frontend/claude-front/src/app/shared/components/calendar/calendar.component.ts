import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormValueControl } from '@angular/forms/signals';
import { NgbDate, NgbDatepicker, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { DATEPICKER_LOCALE_PROVIDERS, dateStructToIso, isoToDateStruct } from '../date-picker/date-picker-locale';

/**
 * Calendario mensual siempre visible (sin campo de texto). El valor es la
 * fecha elegida en 'AAAA-MM-DD'. `marked` resalta días con un punto, por
 * ejemplo los días que tienen gastos.
 *
 * ```html
 * <app-calendar label="Fecha del gasto" [(value)]="date" [marked]="daysWithExpenses()" />
 * ```
 */
@Component({
  selector: 'app-calendar',
  imports: [FormsModule, NgbDatepicker],
  providers: [DATEPICKER_LOCALE_PROVIDERS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
})
export class CalendarComponent implements FormValueControl<string> {
  readonly value = model('');

  /** Nombre accesible del calendario. */
  readonly label = input('Calendario');
  /** Meses visibles a la vez. */
  readonly displayMonths = input(1);
  /** Días a resaltar, 'AAAA-MM-DD'. */
  readonly marked = input<readonly string[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly min = input<string | undefined>(undefined);
  readonly max = input<string | undefined>(undefined);
  readonly touch = output<void>();

  readonly selected = computed(() => isoToDateStruct(this.value()));
  readonly minDate = computed(() => isoToDateStruct(this.min()) ?? undefined);
  readonly maxDate = computed(() => isoToDateStruct(this.max()) ?? undefined);
  private readonly markedSet = computed(() => new Set(this.marked()));

  onSelect(date: NgbDateStruct | null): void {
    this.value.set(dateStructToIso(date));
    this.touch.emit();
  }

  isMarked(date: NgbDate): boolean {
    return this.markedSet().has(dateStructToIso(date));
  }
}
