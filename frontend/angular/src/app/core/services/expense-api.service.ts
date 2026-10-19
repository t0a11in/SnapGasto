import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MonoTypeOperatorFunction, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { apiErrorMessage } from '../http/api-error';
import { Expense, ExpensePayload } from '../models/expense.models';

/** Cliente del módulo de gastos propios del usuario autenticado. */
@Injectable({ providedIn: 'root' })
export class ExpenseApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly endpoint = `${this.baseUrl}/expenses/v1`;

  list(month: string) {
    return this.http.get<Expense[]>(`${this.endpoint}/listar`, { params: this.monthParams(month) }).pipe(this.handleError());
  }

  create(payload: ExpensePayload) {
    return this.http.post<Expense>(`${this.endpoint}/crear`, payload).pipe(this.handleError());
  }

  update(id: string, payload: ExpensePayload) {
    return this.http.put<Expense>(`${this.endpoint}/${id}/actualizar`, payload).pipe(this.handleError());
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.endpoint}/${id}/eliminar`).pipe(this.handleError());
  }

  private monthParams(month: string): HttpParams {
    return new HttpParams().set('month', month);
  }

  private handleError<T>(): MonoTypeOperatorFunction<T> {
    return catchError((error: unknown) => throwError(() => new Error(apiErrorMessage(error))));
  }
}
