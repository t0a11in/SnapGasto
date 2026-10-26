/** Forma mínima de un error de Signal Forms. */
export interface ValidationErrorLike {
  readonly kind: string;
  readonly message?: string;
}

const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  email: 'Ingresa un correo válido.',
  minLength: 'El valor es demasiado corto.',
  maxLength: 'El valor es demasiado largo.',
  min: 'El valor es demasiado bajo.',
  max: 'El valor es demasiado alto.',
  minDate: 'La fecha es anterior a la permitida.',
  maxDate: 'La fecha es posterior a la permitida.',
  pattern: 'El formato no es válido.',
};

/** Convierte los errores de un campo en mensajes legibles (sin duplicados). */
export function validationMessages(errors: readonly ValidationErrorLike[]): string[] {
  const messages = errors.map((e) => e.message ?? DEFAULT_MESSAGES[e.kind] ?? 'Valor no válido.');
  return [...new Set(messages)];
}
