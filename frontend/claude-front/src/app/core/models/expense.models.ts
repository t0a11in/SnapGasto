/**
 * En Java `paymentMethod` es un String libre (máx. 60). El front restringe los
 * valores a esta lista; convertirlo en enum en Java queda como tarea futura.
 */
export type PaymentMethod = 'TARJETA' | 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

export const PAYMENT_METHODS: readonly { value: PaymentMethod; label: string }[] = [
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'OTRO', label: 'Otro' },
];

export interface ExpenseRequest {
  amount: number;
  /** Nombre de la categoría (String, máx. 80 en Java). */
  category: string;
  /** YYYY-MM-DD, no futura. */
  date: string;
  description?: string | null;
  paymentMethod: string;
}

export interface ExpenseResponse {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  paymentMethod: string;
}
