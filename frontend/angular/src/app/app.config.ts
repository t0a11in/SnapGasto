import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './core/http/auth.interceptor';
import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/http/http-error.interceptor';
import { pageRouteInterceptor } from './core/http/page-route.interceptor';
import { tokenLifeInterceptor } from './core/http/token-life.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      tokenLifeInterceptor,
      authInterceptor,
      httpErrorInterceptor,
      pageRouteInterceptor,
    ]))
  ]
};
