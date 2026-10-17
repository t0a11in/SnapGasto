export type Role = 'ADMIN' | 'USER';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: SessionUser;
}

/** Contrato de error estable que devuelve la API de SnapGasto. */
export interface ApiError {
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
}

export interface AdminUser extends SessionUser {
  createdAt: string;
}

export interface AdminUserPayload {
  fullName: string;
  email: string;
  role: Role;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  colorHex: string | null;
}

export interface CategoryPayload {
  name: string;
  icon: string | null;
  colorHex: string | null;
}

export interface AdminExpense {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  paymentMethod: string;
}

export interface AdminExpensePayload {
  userId: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  paymentMethod: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  userName: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  read: boolean;
}
