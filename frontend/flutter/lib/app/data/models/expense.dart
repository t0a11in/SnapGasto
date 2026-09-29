/// Describe un gasto manual persistido en la API.
class Expense {
  const Expense({
    required this.id,
    required this.amount,
    required this.category,
    required this.date,
    required this.description,
    required this.paymentMethod,
  });

  final String id;
  final double amount;
  final String category;
  final DateTime date;
  final String? description;
  final String paymentMethod;

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
    id: json['id'] as String,
    amount: (json['amount'] as num).toDouble(),
    category: json['category'] as String,
    date: DateTime.parse(json['date'] as String),
    description: json['description'] as String?,
    paymentMethod: json['paymentMethod'] as String,
  );
}
