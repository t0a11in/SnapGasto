import 'package:equatable/equatable.dart';

import 'json_utils.dart';

enum IncomeType {
  tarjeta('TARJETA', 'Tarjeta'),
  fisico('FISICO', 'Físico');

  const IncomeType(this.value, this.label);

  final String value;
  final String label;

  static IncomeType fromValue(String value) =>
      IncomeType.values.firstWhere((t) => t.value == value, orElse: () => IncomeType.tarjeta);
}

class IncomeRequest implements JsonEncodable {
  const IncomeRequest({
    required this.amount,
    required this.type,
    required this.date,
    this.description,
  });

  final double amount;
  final IncomeType type;

  /// YYYY-MM-DD, no futura.
  final String date;
  final String? description;

  @override
  JsonMap toJson() => {
        'amount': amount,
        'type': type.value,
        'date': date,
        'description': description,
      };
}

class IncomeResponse extends Equatable implements HasId, HasAmount {
  const IncomeResponse({
    required this.id,
    required this.amount,
    required this.type,
    required this.date,
    this.description,
  });

  @override
  final String id;
  @override
  final double amount;
  final IncomeType type;
  final String date;
  final String? description;

  factory IncomeResponse.fromJson(JsonMap json) => IncomeResponse(
        id: readString(json['id']),
        amount: readAmount(json['amount']),
        type: IncomeType.fromValue(readString(json['type'])),
        date: readString(json['date']),
        description: readNullableString(json['description']),
      );

  @override
  List<Object?> get props => [id, amount, type, date, description];
}

class IncomeMonthlySummaryResponse extends Equatable {
  const IncomeMonthlySummaryResponse({
    required this.month,
    required this.totalTarjeta,
    required this.totalFisico,
    required this.total,
  });

  /// YYYY-MM
  final String month;
  final double totalTarjeta;
  final double totalFisico;
  final double total;

  factory IncomeMonthlySummaryResponse.fromJson(JsonMap json) => IncomeMonthlySummaryResponse(
        month: readString(json['month']),
        totalTarjeta: readAmount(json['totalTarjeta']),
        totalFisico: readAmount(json['totalFisico']),
        total: readAmount(json['total']),
      );

  @override
  List<Object?> get props => [month, totalTarjeta, totalFisico, total];
}
