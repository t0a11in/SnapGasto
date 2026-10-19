import 'package:flutter/material.dart';

import '../../core/utils/chart_palette.dart';

/// Las categorías guardan el nombre de un ícono Feather (compatibles con la web Angular).
/// Aquí se traducen a íconos Material equivalentes.
const Map<String, IconData> featherToMaterial = {
  'activity': Icons.monitor_heart_outlined,
  'airplay': Icons.airplay,
  'anchor': Icons.anchor,
  'award': Icons.emoji_events_outlined,
  'book': Icons.menu_book_outlined,
  'book-open': Icons.auto_stories_outlined,
  'briefcase': Icons.work_outline,
  'camera': Icons.photo_camera_outlined,
  'coffee': Icons.local_cafe_outlined,
  'credit-card': Icons.credit_card,
  'dollar-sign': Icons.attach_money,
  'droplet': Icons.water_drop_outlined,
  'film': Icons.movie_outlined,
  'gift': Icons.card_giftcard,
  'globe': Icons.public,
  'headphones': Icons.headphones_outlined,
  'heart': Icons.favorite_border,
  'home': Icons.home_outlined,
  'map-pin': Icons.place_outlined,
  'monitor': Icons.desktop_windows_outlined,
  'music': Icons.music_note_outlined,
  'package': Icons.inventory_2_outlined,
  'phone': Icons.phone_outlined,
  'scissors': Icons.content_cut,
  'shopping-bag': Icons.shopping_bag_outlined,
  'shopping-cart': Icons.shopping_cart_outlined,
  'smartphone': Icons.smartphone,
  'star': Icons.star_border,
  'sun': Icons.wb_sunny_outlined,
  'tag': Icons.sell_outlined,
  'tool': Icons.build_outlined,
  'truck': Icons.local_shipping_outlined,
  'tv': Icons.tv,
  'umbrella': Icons.beach_access_outlined,
  'user': Icons.person_outline,
  'users': Icons.groups_outlined,
  'wifi': Icons.wifi,
  'zap': Icons.bolt,
};

/// Nombres sugeridos en el formulario de categorías.
final List<String> featherIconNames = featherToMaterial.keys.toList()..sort();

IconData? iconForFeatherName(String? name) => name == null ? null : featherToMaterial[name];

/// Chip cuadrado con el color y el ícono de la categoría.
class CategoryChip extends StatelessWidget {
  const CategoryChip({super.key, this.icon, this.colorHex, this.size = 28});

  final String? icon;
  final String? colorHex;
  final double size;

  @override
  Widget build(BuildContext context) {
    final iconData = iconForFeatherName(icon);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: colorFromHex(colorHex) ?? Theme.of(context).colorScheme.outline,
        borderRadius: BorderRadius.circular(size * 0.28),
      ),
      child: iconData == null ? null : Icon(iconData, size: size * 0.55, color: Colors.white),
    );
  }
}
