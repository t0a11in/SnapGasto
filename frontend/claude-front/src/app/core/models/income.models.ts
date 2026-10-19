export type IncomeType = 'TARJETA' | 'FISICO';

export const INCOME_TYPES: readonly { value: IncomeType; label: string }[] = [
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'FISICO', label: 'Físico' },
];

export interface IncomeRequest {
  amount: number;
  type: IncomeType;
  /** YYYY-MM-DD, no futura. */
  date: string;
  description?: string | null;
}

export interface IncomeResponse {
  id: string;
  amount: number;
  type: IncomeType;
  date: string;
  description: string | null;
}

export interface IncomeMonthlySummaryResponse {
  /** YYYY-MM */
  month: string;
  totalTarjeta: number;
  totalFisico: number;
  total: number;
}
