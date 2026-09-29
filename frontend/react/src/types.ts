/** Tipos compartidos entre los mantenedores administrativos de SnapGasto. */
export type Role = 'USER' | 'ADMIN'

export type SessionUser = {
  id: string
  fullName: string
  email: string
  role: Role
}

export type AuthResponse = {
  accessToken: string
  user: SessionUser
}

export type AdminUser = SessionUser & {
  createdAt: string
}

export type Category = {
  id: string
  name: string
  icon: string | null
  colorHex: string | null
}

export type AdminExpense = {
  id: string
  userId: string
  userName: string
  amount: number
  category: string
  date: string
  description: string | null
  paymentMethod: string
}

export type AppNotification = {
  id: string
  userId: string
  userName: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export type UserPayload = {
  fullName: string
  email: string
  role: Role
  password?: string
}

export type ExpensePayload = {
  userId: string
  amount: number
  category: string
  date: string
  description: string | null
  paymentMethod: string
}

export type CategoryPayload = {
  name: string
  icon: string | null
  colorHex: string | null
}

export type NotificationPayload = {
  userId: string
  title: string
  body: string
  read: boolean
}
