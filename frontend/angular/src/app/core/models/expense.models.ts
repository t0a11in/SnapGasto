export type ExpensePaymentMethod = 'TARJETA' | 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

/** Un gasto perteneciente al usuario autenticado. */
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  paymentMethod: ExpensePaymentMethod;
}

export interface ExpensePayload {
  amount: number;
  category: string;
  date: string;
  description: string | null;
  paymentMethod: ExpensePaymentMethod;
}
