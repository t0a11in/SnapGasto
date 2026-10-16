export type IncomeType = 'TARJETA' | 'FISICO';

export interface Income {
  id: string;
  amount: number;
  type: IncomeType;
  date: string;
  description: string | null;
}

export interface IncomePayload {
  amount: number;
  type: IncomeType;
  date: string;
  description: string | null;
}

export interface IncomeMonthlySummary {
  month: string;
  totalTarjeta: number;
  totalFisico: number;
  total: number;
}
