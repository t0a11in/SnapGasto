/// Medios de pago que expone el mantenedor versionado de gastos.
enum ExpensePaymentMethod {
  tarjeta('TARJETA', 'Tarjeta'),
  efectivo('EFECTIVO', 'Efectivo'),
  transferencia('TRANSFERENCIA', 'Transferencia'),
  otro('OTRO', 'Otro');

  const ExpensePaymentMethod(this.apiValue, this.label);

  final String apiValue;
  final String label;

  /// También acepta valores de instalaciones que usaban etiquetas antes de v1.
  static ExpensePaymentMethod fromApiValue(String value) {
    final normalized = value.trim().toUpperCase();
    return ExpensePaymentMethod.values.firstWhere(
      (method) =>
          method.apiValue == normalized ||
          method.label.toUpperCase() == normalized,
      orElse: () => ExpensePaymentMethod.otro,
    );
  }
}

/// Describe un gasto manual persistido en la API.
class Expense {
  const Expense({
    required this.id,
    required this.amount,
    required this.category,
    required this.date,
    required this.description,
    required this.paymentMethod,
    this.receiptLocalPath,
  });

  final String id;
  final double amount;
  final String category;
  final DateTime date;
  final String? description;
  final ExpensePaymentMethod paymentMethod;

  /// Ruta privada del comprobante; no forma parte del JSON del backend.
  final String? receiptLocalPath;

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
    id: json['id'] as String,
    amount: (json['amount'] as num).toDouble(),
    category: json['category'] as String,
    date: DateTime.parse(json['date'] as String),
    description: json['description'] as String?,
    paymentMethod: ExpensePaymentMethod.fromApiValue(
      json['paymentMethod'] as String,
    ),
  );

  Expense copyWith({String? receiptLocalPath}) => Expense(
    id: id,
    amount: amount,
    category: category,
    date: date,
    description: description,
    paymentMethod: paymentMethod,
    receiptLocalPath: receiptLocalPath ?? this.receiptLocalPath,
  );
}
