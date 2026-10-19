import '../../core/utils/date_utils.dart';

typedef FieldValidator = String? Function(String? value);

final RegExp _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
final RegExp _thousandsDots = RegExp(r'^\d{1,3}(\.\d{3})+$');

/// Monto escrito por el usuario → número.
/// Acepta `12000`, `12.000`, `12.000,5`, `12,5`, `$ 12.000`. null si no es un número.
double? parseAmountInput(String? raw) {
  var text = (raw ?? '').replaceAll(RegExp(r'[\s$]'), '');
  if (text.isEmpty) {
    return null;
  }
  if (text.contains(',')) {
    text = text.replaceAll('.', '').replaceAll(',', '.');
  } else if (_thousandsDots.hasMatch(text)) {
    text = text.replaceAll('.', '');
  }
  final value = double.tryParse(text);
  return value == null || value.isNaN || value.isInfinite ? null : value;
}

/// Validadores de formularios alineados con las reglas de Java.
abstract final class Validators {
  static FieldValidator required(String message) =>
      (value) => (value == null || value.trim().isEmpty) ? message : null;

  static FieldValidator email([String message = 'Ingresa un correo válido.']) => (value) {
        final v = (value ?? '').trim();
        return v.isEmpty || _emailRe.hasMatch(v) ? null : message;
      };

  static FieldValidator maxLength(int max, [String? message]) =>
      (value) => (value ?? '').length > max ? (message ?? 'Máximo $max caracteres.') : null;

  static FieldValidator minLength(int min, String message) => (value) {
        final v = value ?? '';
        return v.isNotEmpty && v.length < min ? message : null;
      };

  static FieldValidator pattern(RegExp re, String message) =>
      (value) => re.hasMatch(value ?? '') ? null : message;

  /// Devuelve el primer error de la lista.
  static FieldValidator compose(List<FieldValidator> validators) => (value) {
        for (final validate in validators) {
          final error = validate(value);
          if (error != null) {
            return error;
          }
        }
        return null;
      };

  /// Monto obligatorio y mayor a 0 (BigDecimal > 0 en Java).
  static String? positiveAmount(String? value) {
    final n = parseAmountInput(value);
    if (n == null) {
      return 'Ingresa un monto.';
    }
    return n > 0 ? null : 'El monto debe ser mayor a 0.';
  }

  /// Fecha YYYY-MM-DD obligatoria y no futura (LocalDate no futura en Java).
  static String? notFutureDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) {
      return 'Selecciona una fecha.';
    }
    return isFutureDate(isoDate) ? 'La fecha no puede ser futura.' : null;
  }
}
