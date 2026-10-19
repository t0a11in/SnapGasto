import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { IncomeMonthlySummaryResponse, IncomeRequest, IncomeResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class IncomesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/incomes/v1`;

  list(month: string): Observable<IncomeResponse[]> {
    return this.http.get<IncomeResponse[]>(`${this.url}/listar`, { params: new HttpParams().set('month', month) });
  }

  summary(month: string): Observable<IncomeMonthlySummaryResponse> {
    return this.http.get<IncomeMonthlySummaryResponse>(`${this.url}/resumen`, {
      params: new HttpParams().set('month', month),
    });
  }

  create(body: IncomeRequest): Observable<IncomeResponse> {
    return this.http.post<IncomeResponse>(`${this.url}/crear`, body);
  }

  update(id: string, body: IncomeRequest): Observable<IncomeResponse> {
    return this.http.put<IncomeResponse>(`${this.url}/${encodeURIComponent(id)}/actualizar`, body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}/eliminar`);
  }
}
