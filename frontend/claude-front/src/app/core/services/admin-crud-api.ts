import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Cliente REST estándar para los mantenedores ADMIN:
 *   GET    /{resource}        → TRes[] (array plano)
 *   GET    /{resource}/{id}   → TRes
 *   POST   /{resource}        → TRes
 *   PATCH  /{resource}/{id}   → TRes
 *   DELETE /{resource}/{id}   → 204
 */
export abstract class AdminCrudApi<TReq, TRes> {
  protected constructor(
    protected readonly http: HttpClient,
    protected readonly url: string,
  ) {}

  list(): Observable<TRes[]> {
    return this.http.get<TRes[]>(this.url);
  }

  get(id: string): Observable<TRes> {
    return this.http.get<TRes>(this.itemUrl(id));
  }

  create(body: TReq): Observable<TRes> {
    return this.http.post<TRes>(this.url, body);
  }

  update(id: string, body: Partial<TReq>): Observable<TRes> {
    return this.http.patch<TRes>(this.itemUrl(id), body);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.itemUrl(id));
  }

  protected itemUrl(id: string): string {
    return `${this.url}/${encodeURIComponent(id)}`;
  }
}
