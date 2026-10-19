part of 'incomes_bloc.dart';

sealed class IncomesEvent extends Equatable {
  const IncomesEvent();

  @override
  List<Object?> get props => [];
}

/// Carga inicial: listado + resumen + total de gastos para el balance.
final class IncomesStarted extends IncomesEvent {
  const IncomesStarted();
}

final class IncomesMonthChanged extends IncomesEvent {
  const IncomesMonthChanged(this.month);

  final String month;

  @override
  List<Object?> get props => [month];
}

/// Recarga el listado y el resumen (tras guardar o "Reintentar").
final class IncomesReloadRequested extends IncomesEvent {
  const IncomesReloadRequested();
}

final class IncomeDeleteRequested extends IncomesEvent {
  const IncomeDeleteRequested(this.id);

  final String id;

  @override
  List<Object?> get props => [id];
}
