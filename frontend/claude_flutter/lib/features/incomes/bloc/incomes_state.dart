part of 'incomes_bloc.dart';

class IncomesState extends Equatable {
  const IncomesState({
    required this.month,
    this.items = const [],
    this.summary,
    this.loading = false,
    this.error,
    this.expenseTotal,
    this.message,
  });

  final String month;
  final List<IncomeResponse> items;
  final IncomeMonthlySummaryResponse? summary;
  final bool loading;
  final String? error;

  /// Gastos del mismo mes, para el balance ingresos − gastos (null = no disponible).
  final double? expenseTotal;

  /// Mensaje de una sola vez para mostrar como toast.
  final UiMessage? message;

  double get incomeTotal => summary?.total ?? sumAmounts(items);

  /// Del más reciente al más antiguo.
  List<IncomeResponse> get sortedItems => [...items]..sort((a, b) => b.date.compareTo(a.date));

  IncomesState copyWith({
    String? month,
    List<IncomeResponse>? items,
    ValueGetter<IncomeMonthlySummaryResponse?>? summary,
    bool? loading,
    ValueGetter<String?>? error,
    ValueGetter<double?>? expenseTotal,
    UiMessage? message,
  }) {
    return IncomesState(
      month: month ?? this.month,
      items: items ?? this.items,
      summary: summary != null ? summary() : this.summary,
      loading: loading ?? this.loading,
      error: error != null ? error() : this.error,
      expenseTotal: expenseTotal != null ? expenseTotal() : this.expenseTotal,
      message: message ?? this.message,
    );
  }

  @override
  List<Object?> get props => [month, items, summary, loading, error, expenseTotal, message];
}
