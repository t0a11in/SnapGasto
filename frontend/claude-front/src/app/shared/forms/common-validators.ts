import { SchemaPath, validate } from '@angular/forms/signals';
import { isFutureDate, todayIso } from '../../core/utils/date.utils';

/** Monto obligatorio y mayor a 0 (BigDecimal > 0 en Java). */
export function positiveAmount(path: SchemaPath<number | null>): void {
  validate(path, ({ value }) => {
    const v = value();
    if (v === null || v === undefined || Number.isNaN(v)) {
      return { kind: 'required', message: 'Ingresa un monto.' };
    }
    return v > 0 ? undefined : { kind: 'positive', message: 'El monto debe ser mayor a 0.' };
  });
}

/** Fecha YYYY-MM-DD obligatoria y no futura (LocalDate no futura en Java). */
export function notFutureDate(path: SchemaPath<string>): void {
  validate(path, ({ value }) => {
    const v = value();
    if (!v) {
      return { kind: 'required', message: 'Selecciona una fecha.' };
    }
    return isFutureDate(v, todayIso())
      ? { kind: 'futureDate', message: 'La fecha no puede ser futura.' }
      : undefined;
  });
}

/** Texto opcional normalizado: cadena vacía → null. */
export function optionalText(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length ? trimmed : null;
}
