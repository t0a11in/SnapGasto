import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('prioriza el mensaje entregado por la API', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'El correo ya está registrado.' },
    });

    expect(apiErrorMessage(error)).toBe('El correo ya está registrado.');
  });

  it('traduce los errores de conexión y de cliente', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 })))
      .toBe('No fue posible conectar con la API de SnapGasto.');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 400 })))
      .toBe('Los datos enviados no son válidos.');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 401 })))
      .toBe('Tu sesión no es válida o expiró. Inicia sesión nuevamente.');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 404 })))
      .toBe('No se encontró el recurso solicitado.');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 422 })))
      .toBe('No fue posible validar los datos enviados.');
  });

  it('traduce los errores del servidor', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 500 })))
      .toBe('La API tuvo un error interno. Inténtalo nuevamente más tarde.');
    expect(apiErrorMessage(new HttpErrorResponse({ status: 503 })))
      .toBe('La API tuvo un error interno. Inténtalo nuevamente más tarde.');
  });
});
