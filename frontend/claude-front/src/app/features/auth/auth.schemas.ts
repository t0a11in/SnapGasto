import { email, maxLength, minLength, required, schema } from '@angular/forms/signals';

export interface LoginModel {
  email: string;
  password: string;
  rememberEmail: boolean;
}

export interface RegisterModel {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const PASSWORD_MIN = 8;

/** Reglas alineadas con AuthRequest (Java). */
export const loginSchema = schema<LoginModel>((p) => {
  required(p.email, { message: 'Ingresa tu correo.' });
  email(p.email, { message: 'Ingresa un correo válido.' });
  required(p.password, { message: 'Ingresa tu contraseña.' });
});

/** Reglas alineadas con RegisterRequest (Java). */
export const registerSchema = schema<RegisterModel>((p) => {
  required(p.fullName, { message: 'Ingresa tu nombre completo.' });
  maxLength(p.fullName, 120, { message: 'Máximo 120 caracteres.' });
  required(p.email, { message: 'Ingresa tu correo.' });
  email(p.email, { message: 'Ingresa un correo válido.' });
  required(p.password, { message: 'Ingresa una contraseña.' });
  minLength(p.password, PASSWORD_MIN, { message: `Mínimo ${PASSWORD_MIN} caracteres.` });
  required(p.confirmPassword, { message: 'Repite la contraseña.' });
});
