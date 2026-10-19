import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import 'ui_message.dart';

/// Notificaciones globales simples (inferiores, 4,5 s).
class ToastService {
  ToastService(this.messengerKey);

  final GlobalKey<ScaffoldMessengerState> messengerKey;

  void success(String text) => _show(text, AppColors.success, Icons.check_circle_outline);

  void error(String text) => _show(text, AppColors.danger, Icons.error_outline);

  void info(String text) => _show(text, AppColors.info, Icons.info_outline);

  void show(UiMessage message) {
    switch (message.type) {
      case UiMessageType.success:
        success(message.text);
      case UiMessageType.error:
        error(message.text);
      case UiMessageType.info:
        info(message.text);
    }
  }

  void _show(String text, Color background, IconData icon) {
    final messenger = messengerKey.currentState;
    if (messenger == null) {
      return;
    }
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: background,
          duration: const Duration(milliseconds: 4500),
          showCloseIcon: true,
          closeIconColor: Colors.white,
          content: Row(
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(child: Text(text, style: const TextStyle(color: Colors.white))),
            ],
          ),
        ),
      );
  }
}
