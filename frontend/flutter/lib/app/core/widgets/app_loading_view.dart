import 'package:flutter/material.dart';

import '../constants/app_colors.dart';

/// Muestra un indicador de carga centrado reutilizable en pantallas del MVP.
class AppLoadingView extends StatelessWidget {
  const AppLoadingView({super.key});

  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator(color: AppColors.primary));
}
