import 'package:bloc_test/bloc_test.dart';
import 'package:claude_flutter/core/data/expenses_api.dart';
import 'package:claude_flutter/core/data/incomes_api.dart';
import 'package:claude_flutter/core/http/api_client.dart';
import 'package:claude_flutter/core/models/models.dart';
import 'package:claude_flutter/features/incomes/bloc/incomes_bloc.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

final ApiClient _unusedClient = ApiClient(Dio(), 'http://unused');

class FakeIncomesApi extends IncomesApi {
  FakeIncomesApi() : super(_unusedClient);

  List<IncomeResponse> items = const [];
  Object? listError;
  final List<String> removed = [];

  @override
  Future<List<IncomeResponse>> list(String month) async {
    if (listError != null) {
      throw listError!;
    }
    return items;
  }

  @override
  Future<IncomeMonthlySummaryResponse> summary(String month) async => IncomeMonthlySummaryResponse(
        month: month,
        totalTarjeta: 1000,
        totalFisico: 500,
        total: 1500,
      );

  @override
  Future<void> remove(String id) async => removed.add(id);
}

class FakeExpensesApi extends ExpensesApi {
  FakeExpensesApi() : super(_unusedClient);

  @override
  Future<List<ExpenseResponse>> list(String month) async => const [
        ExpenseResponse(id: 'e', amount: 400, category: 'Comida', date: '2026-10-01', paymentMethod: 'TARJETA'),
      ];
}

const _income = IncomeResponse(id: 'i1', amount: 1500, type: IncomeType.tarjeta, date: '2026-10-02');

void main() {
  late FakeIncomesApi incomes;

  setUp(() {
    incomes = FakeIncomesApi()..items = const [_income];
  });

  blocTest<IncomesBloc, IncomesState>(
    'carga listado, resumen y gastos para el balance',
    build: () => IncomesBloc(incomesApi: incomes, expensesApi: FakeExpensesApi(), initialMonth: '2026-10'),
    act: (bloc) => bloc.add(const IncomesStarted()),
    verify: (bloc) {
      final s = bloc.state;
      expect(s.loading, isFalse);
      expect(s.items, [_income]);
      expect(s.incomeTotal, 1500);
      expect(s.expenseTotal, 400);
    },
  );

  blocTest<IncomesBloc, IncomesState>(
    'muestra el mensaje de error de la API',
    build: () {
      incomes.listError = const AppHttpError(500, 'Ocurrió un error inesperado en el servidor.');
      return IncomesBloc(incomesApi: incomes, expensesApi: FakeExpensesApi(), initialMonth: '2026-10');
    },
    act: (bloc) => bloc.add(const IncomesReloadRequested()),
    verify: (bloc) => expect(bloc.state.error, 'Ocurrió un error inesperado en el servidor.'),
  );

  blocTest<IncomesBloc, IncomesState>(
    'al eliminar emite un mensaje de éxito y recarga',
    build: () => IncomesBloc(incomesApi: incomes, expensesApi: FakeExpensesApi(), initialMonth: '2026-10'),
    act: (bloc) => bloc.add(const IncomeDeleteRequested('i1')),
    verify: (bloc) {
      expect(incomes.removed, ['i1']);
      expect(bloc.state.message?.text, 'Ingreso eliminado.');
    },
  );

  blocTest<IncomesBloc, IncomesState>(
    'cambiar de mes actualiza el mes y recarga',
    build: () => IncomesBloc(incomesApi: incomes, expensesApi: FakeExpensesApi(), initialMonth: '2026-10'),
    act: (bloc) => bloc.add(const IncomesMonthChanged('2026-09')),
    verify: (bloc) {
      expect(bloc.state.month, '2026-09');
      expect(bloc.state.summary?.month, '2026-09');
    },
  );
}
