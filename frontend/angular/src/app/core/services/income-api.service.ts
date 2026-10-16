import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MonoTypeOperatorFunction, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { apiErrorMessage } from '../http/api-error';
import { Income, IncomeMonthlySummary, IncomePayload } from '../models/income.models';

/** Cliente del módulo versionado de ingresos propios. */
@Injectable({ providedIn: 'root' })
export class IncomeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly endpoint = `${this.baseUrl}/incomes/v1`;

  list(month: string) {
    return this.http.get<Income[]>(`${this.endpoint}/listar`, { params: this.monthParams(month) }).pipe(this.handleError());
  }

  summary(month: string) {
    return this.http.get<IncomeMonthlySummary>(`${this.endpoint}/resumen`, { params: this.monthParams(month) }).pipe(this.handleError());
  }

  create(payload: IncomePayload) {
    return this.http.post<Income>(`${this.endpoint}/crear`, payload).pipe(this.handleError());
  }

  update(id: string, payload: IncomePayload) {
    return this.http.put<Income>(`${this.endpoint}/${id}/actualizar`, payload).pipe(this.handleError());
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
