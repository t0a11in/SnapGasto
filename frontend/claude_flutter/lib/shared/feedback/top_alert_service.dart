import 'dart:async';

import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import 'top_alert_content.dart';

/// Alerta superior temporal (equivalente al toast superior de SweetAlert2 en Angular).
class TopAlertService {
  TopAlertService(this.messengerKey);

  final GlobalKey<ScaffoldMessengerState> messengerKey;
  Timer? _timer;

  void error(String title, {String? text, Duration duration = const Duration(seconds: 10)}) {
    final messenger = messengerKey.currentState;
    if (messenger == null) {
      return;
    }
    _timer?.cancel();
    messenger
      ..hideCurrentMaterialBanner()
      ..showMaterialBanner(
        MaterialBanner(
          backgroundColor: AppColors.dangerSubtle,
          leading: const Icon(Icons.error_outline, color: AppColors.danger),
          content: TopAlertContent(title: title, text: text, duration: duration),
          actions: [
            IconButton(
              tooltip: 'Cerrar',
              icon: const Icon(Icons.close),
              onPressed: dismiss,
            ),
          ],
        ),
      );
    _timer = Timer(duration, dismiss);
  }

  void dismiss() {
    _timer?.cancel();
    _timer = null;
    messengerKey.currentState?.hideCurrentMaterialBanner();
  }
}
