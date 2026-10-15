import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MonoTypeOperatorFunction, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { apiErrorMessage } from '../http/api-error';
import {
  AdminExpense,
  AdminExpensePayload,
  AdminUser,
  AdminUserPayload,
  AppNotification,
  Category,
  CategoryPayload,
  NotificationPayload
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  users() { return this.http.get<AdminUser[]>(`${this.baseUrl}/admin/users`).pipe(this.handleError()); }
  createUser(payload: AdminUserPayload) { return this.http.post<AdminUser>(`${this.baseUrl}/admin/users`, payload).pipe(this.handleError()); }
  updateUser(id: string, payload: AdminUserPayload) { return this.http.put<AdminUser>(`${this.baseUrl}/admin/users/${id}`, payload).pipe(this.handleError()); }
  deleteUser(id: string) { return this.http.delete<void>(`${this.baseUrl}/admin/users/${id}`).pipe(this.handleError()); }

  categories() { return this.http.get<Category[]>(`${this.baseUrl}/admin/categories`).pipe(this.handleError()); }
  createCategory(payload: CategoryPayload) { return this.http.post<Category>(`${this.baseUrl}/admin/categories`, payload).pipe(this.handleError()); }
  updateCategory(id: string, payload: CategoryPayload) { return this.http.put<Category>(`${this.baseUrl}/admin/categories/${id}`, payload).pipe(this.handleError()); }
  deleteCategory(id: string) { return this.http.delete<void>(`${this.baseUrl}/admin/categories/${id}`).pipe(this.handleError()); }

  expenses() { return this.http.get<AdminExpense[]>(`${this.baseUrl}/admin/expenses`).pipe(this.handleError()); }
  createExpense(payload: AdminExpensePayload) { return this.http.post<AdminExpense>(`${this.baseUrl}/admin/expenses`, payload).pipe(this.handleError()); }
  updateExpense(id: string, payload: AdminExpensePayload) { return this.http.put<AdminExpense>(`${this.baseUrl}/admin/expenses/${id}`, payload).pipe(this.handleError()); }
  deleteExpense(id: string) { return this.http.delete<void>(`${this.baseUrl}/admin/expenses/${id}`).pipe(this.handleError()); }

  notifications() { return this.http.get<AppNotification[]>(`${this.baseUrl}/admin/notifications`).pipe(this.handleError()); }
  createNotification(payload: NotificationPayload) { return this.http.post<AppNotification>(`${this.baseUrl}/admin/notifications`, payload).pipe(this.handleError()); }
  updateNotification(id: string, payload: NotificationPayload) { return this.http.put<AppNotification>(`${this.baseUrl}/admin/notifications/${id}`, payload).pipe(this.handleError()); }
  deleteNotification(id: string) { return this.http.delete<void>(`${this.baseUrl}/admin/notifications/${id}`).pipe(this.handleError()); }

  private handleError<T>(): MonoTypeOperatorFunction<T> {
    return catchError((error: unknown) => throwError(() => new Error(apiErrorMessage(error))));
  }
}
