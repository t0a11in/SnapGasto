import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ExpenseRequest, ExpenseResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ExpensesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/expenses/v1`;

  list(month: string): Observable<ExpenseResponse[]> {
    return this.http.get<ExpenseResponse[]>(`${this.url}/listar`, { params: new HttpParams().set('month', month) });
  }

  create(body: ExpenseRequest): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(`${this.url}/crear`, body);
  }

  update(id: string, body: ExpenseRequest): Observable<ExpenseResponse> {
    return this.http.put<ExpenseResponse>(`${this.url}/${encodeURIComponent(id)}/actualizar`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}/eliminar`);
  }
}
