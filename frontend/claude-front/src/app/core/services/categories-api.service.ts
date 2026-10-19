import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { SKIP_AUTO_LOGOUT } from '../http/http-context';
import { CategoryResponse } from '../models';

/**
 * Lectura de categorías para usuarios USER y ADMIN.
 * PENDIENTE EN JAVA: `GET /api/categories` → List<CategoryResponse> (ver README).
 * Mientras no exista, el formulario de gastos cae a texto libre.
 */
@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/categories`;

  list(): Observable<CategoryResponse[]> {
    // Si el endpoint aún no existe (404/401/403) no debe cerrar la sesión.
    return this.http.get<CategoryResponse[]>(this.url, {
      context: new HttpContext().set(SKIP_AUTO_LOGOUT, true),
    });
  }
}
