part of 'expenses_bloc.dart';

class ExpensesState extends Equatable {
  ExpensesState({
    required this.month,
    this.items = const [],
    this.loading = false,
    this.error,
    this.categories = const [],
    this.categoriesAvailable = false,
    this.incomeTotal,
    this.message,
  });

  final String month;
  final List<ExpenseResponse> items;
  final bool loading;
  final String? error;

  /// Si el endpoint de categorías no responde, el formulario usa texto libre.
  final List<CategoryResponse> categories;
  final bool categoriesAvailable;

  /// Ingresos del mismo mes, para el balance ingresos − gastos (null = no disponible).
  final double? incomeTotal;

  /// Mensaje de una sola vez para mostrar como toast.
  final UiMessage? message;

  /// Totales, agrupación por categoría, colores y datos del gráfico (se calculan una vez por estado).
  late final ExpenseStats stats = ExpenseStats(items, categories);

  ExpensesState copyWith({
    String? month,
    List<ExpenseResponse>? items,
    bool? loading,
    ValueGetter<String?>? error,
    List<CategoryResponse>? categories,
    bool? categoriesAvailable,
    ValueGetter<double?>? incomeTotal,
    UiMessage? message,
  }) {
    return ExpensesState(
      month: month ?? this.month,
      items: items ?? this.items,
      loading: loading ?? this.loading,
      error: error != null ? error() : this.error,
      categories: categories ?? this.categories,
      categoriesAvailable: categoriesAvailable ?? this.categoriesAvailable,
      incomeTotal: incomeTotal != null ? incomeTotal() : this.incomeTotal,
      message: message ?? this.message,
    );
  }

  @override
  List<Object?> get props => [month, items, loading, error, categories, categoriesAvailable, incomeTotal, message];
}
