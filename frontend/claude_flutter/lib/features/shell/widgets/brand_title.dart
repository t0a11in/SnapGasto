import 'package:flutter/material.dart';

/// Logotipo de texto "SnapGasto".
class BrandTitle extends StatelessWidget {
  const BrandTitle({super.key, this.size = 22});

  final double size;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.primary;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.photo_camera_outlined, color: color, size: size),
        const SizedBox(width: 8),
        Text(
          'SnapGasto',
          style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: size * 0.9),
        ),
      ],
    );
  }
}
