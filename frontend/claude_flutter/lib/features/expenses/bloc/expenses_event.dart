part of 'expenses_bloc.dart';

sealed class ExpensesEvent extends Equatable {
  const ExpensesEvent();

  @override
  List<Object?> get props => [];
}

/// Carga inicial: gastos + total de ingresos (balance) + catálogo de categorías.
final class ExpensesStarted extends ExpensesEvent {
  const ExpensesStarted();
}

final class ExpensesMonthChanged extends ExpensesEvent {
  const ExpensesMonthChanged(this.month);

  final String month;

  @override
  List<Object?> get props => [month];
}

/// Recarga el listado (tras guardar o "Reintentar").
final class ExpensesReloadRequested extends ExpensesEvent {
  const ExpensesReloadRequested();
}

final class ExpenseDeleteRequested extends ExpensesEvent {
  const ExpenseDeleteRequested(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}
