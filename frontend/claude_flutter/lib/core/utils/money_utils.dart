import '../models/json_utils.dart';

double sumAmounts(Iterable<HasAmount> items) => items.fold(0.0, (acc, item) => acc + item.amount);
