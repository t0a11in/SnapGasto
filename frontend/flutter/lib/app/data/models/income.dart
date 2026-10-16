/// Tipos de ingreso reconocidos por la API versionada de SnapGasto.
enum IncomeType {
  tarjeta('TARJETA', 'Tarjeta'),
  fisico('FISICO', 'Físico');

  const IncomeType(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static IncomeType fromApiValue(String value) => IncomeType.values.firstWhere(
    (type) => type.apiValue == value,
    orElse: () =>
        throw FormatException('Tipo de ingreso no reconocido: $value'),
  );
}

/// Describe un ingreso propio persistido por la API.
class Income {
  const Income({
    required this.id,
    required this.amount,
    required this.type,
    required this.date,
    required this.description,
  });

  final String id;
  final double amount;
  final IncomeType type;
  final DateTime date;
  final String? description;

  factory Income.fromJson(Map<String, dynamic> json) => Income(
    id: json['id'] as String,
    amount: (json['amount'] as num).toDouble(),
    type: IncomeType.fromApiValue(json['type'] as String),
    date: DateTime.parse(json['date'] as String),
    description: json['description'] as String?,
  );
}

/// Resume los ingresos por origen para un mes consultado.
class IncomeMonthlySummary {
  const IncomeMonthlySummary({
    required this.month,
    required this.totalTarjeta,
    required this.totalFisico,
    required this.total,
  });

  final String month;
  final double totalTarjeta;
  final double totalFisico;
  final double total;

  factory IncomeMonthlySummary.fromJson(Map<String, dynamic> json) =>
      IncomeMonthlySummary(
        month: json['month'] as String,
        totalTarjeta: (json['totalTarjeta'] as num).toDouble(),
        totalFisico: (json['totalFisico'] as num).toDouble(),
        total: (json['total'] as num).toDouble(),
      );
}
