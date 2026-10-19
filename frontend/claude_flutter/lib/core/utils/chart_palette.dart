import 'dart:ui';

/// Paleta categórica validada (orden fijo, nunca cíclico) para el gráfico de torta.
/// Se usan como máximo 6 tonos: con 7 el último (violeta) quedaría junto al primero
/// (azul) al cerrar el círculo y no se distinguen con daltonismo. Las categorías
/// restantes se agrupan en "Otras" con un gris neutro.
const List<Color> categoricalPalette = [
  Color(0xFF2A78D6),
  Color(0xFFEB6834),
  Color(0xFF1BAF7A),
  Color(0xFFEDA100),
  Color(0xFFE87BA4),
  Color(0xFF008300),
];

const Color otherColor = Color(0xFF8B8F97);

/// `#22C55E` → Color (null si el formato no es #RRGGBB).
Color? colorFromHex(String? hex) {
  if (hex == null || !RegExp(r'^#[0-9A-Fa-f]{6}$').hasMatch(hex)) {
    return null;
  }
  return Color(int.parse('FF${hex.substring(1)}', radix: 16));
}
