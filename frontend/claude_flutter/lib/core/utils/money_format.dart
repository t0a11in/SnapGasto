final RegExp _thousands = RegExp(r'\B(?=(\d{3})+(?!\d))');

/// Formato de montos chilenos: separador de miles con punto, sin decimales.
/// `formatMoney(1234567)` → `$1.234.567`
String formatMoney(num? value, {bool withSymbol = true}) {
  final v = value ?? 0;
  final n = v.isFinite ? v.round() : 0;
  final digits = n.abs().toString().replaceAll(_thousands, '.');
  return '${n < 0 ? '-' : ''}${withSymbol ? r'$' : ''}$digits';
}

/// Porcentaje con coma decimal: `formatPercent(0.1234)` → `12,3 %`
String formatPercent(double? ratio, {int decimals = 1}) {
  final r = ratio ?? 0.0;
  final value = r.isFinite ? r * 100 : 0.0;
  return '${value.toStringAsFixed(decimals).replaceAll('.', ',')} %';
}

/// Número entero con separador de miles: `formatNumber(12000)` → `12.000`
String formatNumber(num? value) => formatMoney(value, withSymbol: false);
