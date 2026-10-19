import 'package:equatable/equatable.dart';

enum UiMessageType { success, error, info }

/// Mensaje de una sola vez emitido por un BLoC (se muestra como toast).
/// El `id` incremental hace que dos mensajes con el mismo texto sean distintos.
class UiMessage extends Equatable {
  UiMessage._(this.type, this.text) : id = ++_nextId;

  factory UiMessage.success(String text) => UiMessage._(UiMessageType.success, text);

  factory UiMessage.error(String text) => UiMessage._(UiMessageType.error, text);

  factory UiMessage.info(String text) => UiMessage._(UiMessageType.info, text);

  static int _nextId = 0;

  final int id;
  final UiMessageType type;
  final String text;

  @override
  List<Object?> get props => [id];
}
