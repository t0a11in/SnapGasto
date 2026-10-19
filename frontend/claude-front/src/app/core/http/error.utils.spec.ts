import { HttpErrorResponse } from '@angular/common/http';
import { AppHttpError } from '../models';
import { toAppHttpError } from './error.utils';

describe('toAppHttpError', () => {
  it('usa ApiError.message cuando existe', () => {
    const e = toAppHttpError(new HttpErrorResponse({ status: 400, error: { message: 'Monto inválido' } }));
    expect(e).toEqual(jasmine.any(AppHttpError));
    expect(e.status).toBe(400);
    expect(e.message).toBe('Monto inválido');
  });

  it('parsea cuerpos de texto JSON', () => {
    const e = toAppHttpError(new HttpErrorResponse({ status: 409, error: '{"message":"Email ya registrado"}' }));
    expect(e.message).toBe('Email ya registrado');
  });

  it('usa mensajes por defecto según el estado', () => {
    expect(toAppHttpError(new HttpErrorResponse({ status: 0 })).message).toContain('conectar');
    expect(toAppHttpError(new HttpErrorResponse({ status: 503 })).message).toContain('servidor');
  });

  it('devuelve el mismo AppHttpError', () => {
    const original = new AppHttpError(404, 'x');
    expect(toAppHttpError(original)).toBe(original);
  });
});
