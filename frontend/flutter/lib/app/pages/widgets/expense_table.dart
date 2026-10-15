import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../data/models/expense.dart';

/// Tabla horizontalmente desplazable para consultar y ordenar gastos en móvil.
class ExpenseTable extends StatefulWidget {
  const ExpenseTable({
    required this.expenses,
    required this.onViewReceipt,
    required this.onDelete,
    super.key,
  });

  final List<Expense> expenses;
  final ValueChanged<Expense> onViewReceipt;
  final ValueChanged<Expense> onDelete;

  @override
  State<ExpenseTable> createState() => _ExpenseTableState();
}

class _ExpenseTableState extends State<ExpenseTable> {
  _ExpenseSortColumn _sortColumn = _ExpenseSortColumn.date;
  bool _ascending = false;

  @override
  Widget build(BuildContext context) {
    final expenses = List<Expense>.of(widget.expenses)..sort(_compare);
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        sortColumnIndex: _sortColumn.index,
        sortAscending: _ascending,
        columnSpacing: 24,
        columns: [
          DataColumn(
            label: const Text('Fecha'),
            onSort: (_, ascending) =>
                _sortBy(_ExpenseSortColumn.date, ascending),
          ),
          DataColumn(
            label: const Text('Descripción'),
            onSort: (_, ascending) =>
                _sortBy(_ExpenseSortColumn.description, ascending),
          ),
          DataColumn(
            label: const Text('Categoría'),
            onSort: (_, ascending) =>
                _sortBy(_ExpenseSortColumn.category, ascending),
          ),
          DataColumn(
            numeric: true,
            label: const Text('Monto'),
            onSort: (_, ascending) =>
                _sortBy(_ExpenseSortColumn.amount, ascending),
          ),
          const DataColumn(label: Text('Boleta')),
          const DataColumn(label: Text('Acciones')),
        ],
        rows: expenses.map(_row).toList(growable: false),
      ),
    );
  }

  DataRow _row(Expense expense) => DataRow(
    cells: [
      DataCell(Text(DateFormat.yMMMd('es_CL').format(expense.date))),
      DataCell(
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 190),
          child: Text(expense.description ?? 'Sin descripción'),
        ),
      ),
      DataCell(Text(expense.category)),
      DataCell(Text(_currency(expense.amount))),
      DataCell(
        expense.receiptLocalPath == null
            ? const Tooltip(
                message: 'Sin imagen adjunta',
                child: Icon(Icons.image_not_supported_outlined),
              )
            : IconButton(
                tooltip: 'Ver boleta local',
                onPressed: () => widget.onViewReceipt(expense),
                icon: const Icon(Icons.image_outlined),
              ),
      ),
      DataCell(
        IconButton(
          tooltip: 'Eliminar gasto',
          onPressed: () => widget.onDelete(expense),
          icon: const Icon(Icons.delete_outline),
        ),
      ),
    ],
  );

  int _compare(Expense first, Expense second) {
    final comparison = switch (_sortColumn) {
      _ExpenseSortColumn.date => first.date.compareTo(second.date),
      _ExpenseSortColumn.description => (first.description ?? '').compareTo(
        second.description ?? '',
      ),
      _ExpenseSortColumn.category => first.category.compareTo(second.category),
      _ExpenseSortColumn.amount => first.amount.compareTo(second.amount),
    };
    return _ascending ? comparison : -comparison;
  }

  void _sortBy(_ExpenseSortColumn column, bool ascending) {
    setState(() {
      _sortColumn = column;
      _ascending = ascending;
    });
  }
}

enum _ExpenseSortColumn { date, description, category, amount }

String _currency(double amount) =>
    NumberFormat.currency(locale: 'es_CL', symbol: '\$').format(amount);
