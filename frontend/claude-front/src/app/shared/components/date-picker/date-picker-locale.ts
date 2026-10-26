import { Injectable, Provider } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const pad = (n: number): string => String(n).padStart(2, '0');
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CL_RE = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;

function isRealDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/** 'AAAA-MM-DD' → NgbDateStruct (o null si está vacío o no es una fecha real). */
export function isoToDateStruct(value: string | null | undefined): NgbDateStruct | null {
  const m = ISO_RE.exec(value ?? '');
  if (!m) {
    return null;
  }
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return isRealDate(year, month, day) ? { year, month, day } : null;
}

/** NgbDateStruct → 'AAAA-MM-DD' (cadena vacía si es null). */
export function dateStructToIso(date: NgbDateStruct | null | undefined): string {
  return date ? `${date.year}-${pad(date.month)}-${pad(date.day)}` : '';
}

/** Nombres de meses y días en español para los calendarios de ng-bootstrap. */
@Injectable()
export class SpanishDatepickerI18n extends NgbDatepickerI18n {
  getWeekdayLabel(weekday: number, width?: Intl.DateTimeFormatOptions['weekday']): string {
    return width === 'long' ? WEEKDAYS_LONG[weekday - 1] : WEEKDAYS_SHORT[weekday - 1];
  }

  getMonthShortName(month: number): string {
    return MONTHS[month - 1].slice(0, 3);
  }

  getMonthFullName(month: number): string {
    return MONTHS[month - 1];
  }

  getDayAriaLabel(date: NgbDateStruct): string {
    return `${date.day} de ${MONTHS[date.month - 1]} de ${date.year}`;
  }
}

/** Muestra y lee las fechas como dd-mm-aaaa (también acepta / y .). */
@Injectable()
export class ChileDateParserFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    const m = CL_RE.exec(value.trim());
    if (!m) {
      return null;
    }
    const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return isRealDate(year, month, day) ? { year, month, day } : null;
  }

  format(date: NgbDateStruct | null): string {
    return date ? `${pad(date.day)}-${pad(date.month)}-${date.year}` : '';
  }
}

/** Proveedores de idioma y formato para cualquier calendario de la app. */
export const DATEPICKER_LOCALE_PROVIDERS: Provider[] = [
  { provide: NgbDatepickerI18n, useClass: SpanishDatepickerI18n },
  { provide: NgbDateParserFormatter, useClass: ChileDateParserFormatter },
];
