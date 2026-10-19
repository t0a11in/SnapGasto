import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/expenses_api.dart';
import '../../../core/data/incomes_api.dart';
import '../../../core/http/error_utils.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/money_utils.dart';
import '../../../shared/feedback/ui_message.dart';

part 'incomes_event.dart';
part 'incomes_state.dart';

/// Estado de la pantalla de ingresos (mes seleccionado, listado, resumen y balance).
class IncomesBloc extends Bloc<IncomesEvent, IncomesState> {
  IncomesBloc({required IncomesApi incomesApi, required ExpensesApi expensesApi, String? initialMonth})
      : _api = incomesApi,
        _expensesApi = expensesApi,
        super(IncomesState(month: initialMonth ?? currentMonth())) {
    on<IncomesStarted>(_onStarted);
    on<IncomesMonthChanged>(_onMonthChanged);
    on<IncomesReloadRequested>((event, emit) => _load(emit));
    on<IncomeDeleteRequested>(_onDelete);
  }

  final IncomesApi _api;
  final ExpensesApi _expensesApi;

  Future<void> _onStarted(IncomesStarted event, Emitter<IncomesState> emit) async {
    await Future.wait([_load(emit), _loadBalance(emit)]);
  }

  Future<void> _onMonthChanged(IncomesMonthChanged event, Emitter<IncomesState> emit) async {
    if (event.month == state.month) {
      return;
    }
    emit(state.copyWith(month: event.month));
    await Future.wait([_load(emit), _loadBalance(emit)]);
  }

  Future<void> _load(Emitter<IncomesState> emit) async {
    final month = state.month;
    emit(state.copyWith(loading: true, error: () => null));
    try {
      final itemsFuture = _api.list(month);
      final summaryFuture = _api.summary(month);
      await Future.wait<Object?>([itemsFuture, summaryFuture], eagerError: true);
      final items = await itemsFuture;
      final summary = await summaryFuture;
      if (month != state.month) {
        return; // respuesta de un mes que ya no está seleccionado
      }
      emit(state.copyWith(items: items, summary: () => summary, loading: false));
    } on Object catch (e) {
      if (month == state.month) {
        emit(state.copyWith(loading: false, error: () => errorMessage(e)));
      }
    }
  }

  /// Carga el total de gastos del mes para mostrar la diferencia.
  Future<void> _loadBalance(Emitter<IncomesState> emit) async {
    final month = state.month;
    emit(state.copyWith(expenseTotal: () => null));
    double? total;
    try {
      total = sumAmounts(await _expensesApi.list(month));
    } on Object {
      total = null;
    }
    if (month == state.month) {
      emit(state.copyWith(expenseTotal: () => total));
    }
  }

  Future<void> _onDelete(IncomeDeleteRequested event, Emitter<IncomesState> emit) async {
    try {
      await _api.remove(event.id);
      emit(state.copyWith(message: UiMessage.success('Ingreso eliminado.')));
      await _load(emit);
    } on Object catch (e) {
      emit(state.copyWith(message: UiMessage.error(errorMessage(e))));
    }
  }
}
