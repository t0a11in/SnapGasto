import { Pipe, PipeTransform } from '@angular/core';
import { formatMoney, formatNumber, formatPercent } from './money.format';

/** {{ monto | money }} → $1.234.567 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, withSymbol = true): string {
    return formatMoney(value, withSymbol);
  }
}

/** {{ cantidad | thousands }} → 12.000 */
@Pipe({ name: 'thousands' })
export class ThousandsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value);
  }
}

/** {{ 0.25 | percent1 }} → 25,0 % */
@Pipe({ name: 'percent1' })
export class Percent1Pipe implements PipeTransform {
  transform(ratio: number | null | undefined, decimals = 1): string {
    return formatPercent(ratio ?? 0, decimals);
  }
}
