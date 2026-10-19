import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Todas las rutas dependen de la sesión guardada en localStorage (solo navegador),
 * por eso se renderizan en el cliente. El servidor solo entrega el shell HTML.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
