const Map<String, String> _accents = {
  'á': 'a',
  'é': 'e',
  'í': 'i',
  'ó': 'o',
  'ú': 'u',
  'ü': 'u',
  'à': 'a',
  'è': 'e',
  'ì': 'i',
  'ò': 'o',
  'ù': 'u',
};

/// Minúsculas sin tildes (la ñ se conserva).
String foldText(String value) {
  final lower = value.toLowerCase();
  final buffer = StringBuffer();
  for (final rune in lower.runes) {
    final ch = String.fromCharCode(rune);
    buffer.write(_accents[ch] ?? ch);
  }
  return buffer.toString();
}

/// Comparación alfabética aproximada al español (equivalente a localeCompare('es')).
int compareEs(String a, String b) {
  final byFolded = foldText(a).compareTo(foldText(b));
  return byFolded != 0 ? byFolded : a.compareTo(b);
}

/// Texto opcional normalizado: cadena vacía → null.
String? optionalText(String? value) {
  final trimmed = (value ?? '').trim();
  return trimmed.isEmpty ? null : trimmed;
}
