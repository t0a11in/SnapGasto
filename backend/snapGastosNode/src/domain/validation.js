const { badRequest } = require('./errors');

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) throw badRequest(`El campo ${field} es obligatorio.`);
  const normalized = value.trim();
  if (maxLength && normalized.length > maxLength) throw badRequest(`El campo ${field} supera el máximo permitido.`);
  return normalized;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === '') return null;
  return requiredText(value, field, maxLength);
}

function email(value) {
  const normalized = requiredText(value, 'correo', 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw badRequest('El correo no es válido.');
  return normalized;
}

function password(value, required = true) {
  if ((value === undefined || value === null || value === '') && !required) return null;
  const normalized = requiredText(value, 'contraseña', 100);
  if (normalized.length < 8) throw badRequest('La contraseña debe tener al menos 8 caracteres.');
  return normalized;
}

function money(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw badRequest('El monto debe ser mayor que cero.');
  return parsed;
}

function pastOrPresentDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw badRequest('La fecha es obligatoria.');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || value > new Date().toISOString().slice(0, 10)) {
    throw badRequest('La fecha no puede ser futura.');
  }
  return value;
}

function uuid(value, field = 'identificador') {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw badRequest(`El ${field} no es válido.`);
  }
  return value;
}

module.exports = { requiredText, optionalText, email, password, money, pastOrPresentDate, uuid };
