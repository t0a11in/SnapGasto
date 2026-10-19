String _pad(int n) => n.toString().padLeft(2, '0');

const List<String> monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const List<String> monthShortNames = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

/// Fecha local en formato YYYY-MM-DD.
String toIsoDate(DateTime d) => '${d.year}-${_pad(d.month)}-${_pad(d.day)}';

/// Fecha local de hoy en formato YYYY-MM-DD.
String todayIso([DateTime? now]) => toIsoDate(now ?? DateTime.now());

/// Mes local en formato YYYY-MM.
String currentMonth([DateTime? now]) {
  final d = now ?? DateTime.now();
  return '${d.year}-${_pad(d.month)}';
}

final RegExp _monthRe = RegExp(r'^(\d{4})-(\d{2})$');
final RegExp _dateRe = RegExp(r'^(\d{4})-(\d{2})-(\d{2})');

bool isValidMonth(String value) {
  final m = _monthRe.firstMatch(value);
  if (m == null) {
    return false;
  }
  final month = int.parse(m.group(2)!);
  return month >= 1 && month <= 12;
}

/// Suma (o resta) meses a un valor YYYY-MM.
String shiftMonth(String month, int delta) {
  final m = _monthRe.firstMatch(month);
  if (m == null) {
    throw ArgumentError('Mes inválido: $month');
  }
  final total = int.parse(m.group(1)!) * 12 + (int.parse(m.group(2)!) - 1) + delta;
  return '${total ~/ 12}-${_pad(total % 12 + 1)}';
}

/// Las fechas YYYY-MM-DD se comparan lexicográficamente.
bool isFutureDate(String date, [String? today]) => date.compareTo(today ?? todayIso()) > 0;

/// Primer día del mes si `today` no pertenece al mes; si pertenece, hoy.
String defaultDateForMonth(String month, [String? today]) {
  final t = today ?? todayIso();
  return t.startsWith(month) ? t : '$month-01';
}

/// `2026-10-18` → DateTime local (null si no es válida).
DateTime? parseIsoDate(String? value) {
  if (value == null) {
    return null;
  }
  final m = _dateRe.firstMatch(value);
  if (m == null) {
    return null;
  }
  return DateTime(int.parse(m.group(1)!), int.parse(m.group(2)!), int.parse(m.group(3)!));
}

/// `2026-10-18` → `18-10-2026`
String formatDateDisplay(String iso) {
  final d = parseIsoDate(iso);
  return d == null ? iso : '${_pad(d.day)}-${_pad(d.month)}-${d.year}';
}

/// Fecha y hora ISO (createdAt) → `18-10-2026 14:05` en hora local.
String formatDateTimeDisplay(String iso) {
  final d = DateTime.tryParse(iso);
  if (d == null) {
    return formatDateDisplay(iso);
  }
  final l = d.isUtc ? d.toLocal() : d;
  return '${_pad(l.day)}-${_pad(l.month)}-${l.year} ${_pad(l.hour)}:${_pad(l.minute)}';
}

/// `2026-10` → `Octubre 2026`
String formatMonthLabel(String month) {
  final m = _monthRe.firstMatch(month);
  if (m == null || !isValidMonth(month)) {
    return month;
  }
  return '${monthNames[int.parse(m.group(2)!) - 1]} ${m.group(1)}';
}
