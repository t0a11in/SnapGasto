import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/categories_api.dart';
import '../../../core/data/expenses_api.dart';
import '../../../core/data/incomes_api.dart';
import '../../../core/http/error_utils.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/text_utils.dart';
import '../../../shared/feedback/ui_message.dart';
import '../domain/expense_stats.dart';

part 'expenses_event.dart';
part 'expenses_state.dart';

/// Estado de la pantalla de gastos. El total mensual y la agrupación se calculan en el front.
class ExpensesBloc extends Bloc<ExpensesEvent, ExpensesState> {
  ExpensesBloc({
    required ExpensesApi expensesApi,
    required IncomesApi incomesApi,
    required CategoriesApi categoriesApi,
    String? initialMonth,
  })  : _api = expensesApi,
        _incomesApi = incomesApi,
        _categoriesApi = categoriesApi,
        super(ExpensesState(month: initialMonth ?? currentMonth())) {
    on<ExpensesStarted>(_onStarted);
    on<ExpensesMonthChanged>(_onMonthChanged);
    on<ExpensesReloadRequested>((event, emit) => _load(emit));
    on<ExpenseDeleteRequested>(_onDelete);
  }

  final ExpensesApi _api;
  final IncomesApi _incomesApi;
  final CategoriesApi _categoriesApi;

  Future<void> _onStarted(ExpensesStarted event, Emitter<ExpensesState> emit) async {
    await Future.wait([_load(emit), _loadBalance(emit), _loadCategories(emit)]);
  }

  Future<void> _onMonthChanged(ExpensesMonthChanged event, Emitter<ExpensesState> emit) async {
    if (event.month == state.month) {
      return;
    }
    emit(state.copyWith(month: event.month));
    await Future.wait([_load(emit), _loadBalance(emit)]);
  }

  Future<void> _load(Emitter<ExpensesState> emit) async {
    final month = state.month;
    emit(state.copyWith(loading: true, error: () => null));
    try {
      final items = await _api.list(month);
      if (month == state.month) {
        emit(state.copyWith(items: items, loading: false));
      }
    } on Object catch (e) {
      if (month == state.month) {
        emit(state.copyWith(loading: false, error: () => errorMessage(e)));
      }
    }
  }

  Future<void> _loadCategories(Emitter<ExpensesState> emit) async {
    try {
      final list = await _categoriesApi.list();
      emit(
        state.copyWith(
          categories: [...list]..sort((a, b) => compareEs(a.name, b.name)),
          categoriesAvailable: list.isNotEmpty,
        ),
      );
    } on Object {
      emit(state.copyWith(categories: const [], categoriesAvailable: false));
    }
  }

  /// Carga el total de ingresos del mes (resumen) para mostrar la diferencia.
  Future<void> _loadBalance(Emitter<ExpensesState> emit) async {
    final month = state.month;
    emit(state.copyWith(incomeTotal: () => null));
    double? total;
    try {
      total = (await _incomesApi.summary(month)).total;
    } on Object {
      total = null;
    }
    if (month == state.month) {
      emit(state.copyWith(incomeTotal: () => total));
    }
  }

  Future<void> _onDelete(ExpenseDeleteRequested event, Emitter<ExpensesState> emit) async {
    try {
      await _api.remove(event.id);
      emit(state.copyWith(message: UiMessage.success('Gasto eliminado.')));
      await _load(emit);
    } on Object catch (e) {
      emit(state.copyWith(message: UiMessage.error(errorMessage(e))));
    }
  }
}
