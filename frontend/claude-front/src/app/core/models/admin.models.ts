import { Role } from './auth.models';

export interface AdminUserRequest {
  fullName: string;
  email: string;
  role: Role;
  /** Obligatoria al crear; opcional al editar (si viene, mínimo 8). */
  password?: string;
}

export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface CategoryRequest {
  name: string;
  icon?: string | null;
  /** Formato #RRGGBB */
  colorHex?: string | null;
}

export interface CategoryResponse {
  id: string;
  name: string;
  icon: string | null;
  colorHex: string | null;
}

export interface AdminExpenseRequest {
  userId: string;
  amount: number;
  category: string;
  date: string;
  description?: string | null;
  paymentMethod: string;
}

export interface AdminExpenseResponse {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  paymentMethod: string;
}

export interface NotificationRequest {
  userId: string;
  title: string;
  body: string;
  read: boolean;
}

export interface NotificationResponse {
  id: string;
  userId: string;
  userName: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
