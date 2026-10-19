import 'package:equatable/equatable.dart';

import 'json_utils.dart';

/// En Java `paymentMethod` es un String libre (máx. 60). El front restringe los
/// valores a esta lista; convertirlo en enum en Java queda como tarea futura.
enum PaymentMethod {
  tarjeta('TARJETA', 'Tarjeta'),
  efectivo('EFECTIVO', 'Efectivo'),
  transferencia('TRANSFERENCIA', 'Transferencia'),
  otro('OTRO', 'Otro');

  const PaymentMethod(this.value, this.label);

  final String value;
  final String label;

  /// Valor desconocido → OTRO (igual que el formulario Angular).
  static PaymentMethod fromValue(String value) =>
      PaymentMethod.values.firstWhere((p) => p.value == value, orElse: () => PaymentMethod.otro);

  /// Etiqueta legible; si el valor no está en la lista se muestra tal cual.
  static String labelOf(String value) {
    for (final p in PaymentMethod.values) {
      if (p.value == value) {
        return p.label;
      }
    }
    return value;
  }
}

class ExpenseRequest implements JsonEncodable {
  const ExpenseRequest({
    required this.amount,
    required this.category,
    required this.date,
    required this.paymentMethod,
    this.description,
  });

  final double amount;

  /// Nombre de la categoría (String, máx. 80 en Java).
  final String category;

  /// YYYY-MM-DD, no futura.
  final String date;
  final String? description;
  final String paymentMethod;

  @override
  JsonMap toJson() => {
        'amount': amount,
        'category': category,
        'date': date,
        'description': description,
        'paymentMethod': paymentMethod,
      };
}

class ExpenseResponse extends Equatable implements HasId, HasAmount {
  const ExpenseResponse({
    required this.id,
    required this.amount,
    required this.category,
    required this.date,
    required this.paymentMethod,
    this.description,
  });

  @override
  final String id;
  @override
  final double amount;
  final String category;
  final String date;
  final String? description;
  final String paymentMethod;

  factory ExpenseResponse.fromJson(JsonMap json) => ExpenseResponse(
        id: readString(json['id']),
        amount: readAmount(json['amount']),
        category: readString(json['category']),
        date: readString(json['date']),
        description: readNullableString(json['description']),
        paymentMethod: readString(json['paymentMethod']),
      );

  @override
  List<Object?> get props => [id, amount, category, date, description, paymentMethod];
}
