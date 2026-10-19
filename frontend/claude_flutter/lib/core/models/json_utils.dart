/// Ayudas para leer JSON de la API Java de forma tolerante.
typedef JsonMap = Map<String, dynamic>;

/// Objetos que se envían como cuerpo JSON.
abstract interface class JsonEncodable {
  JsonMap toJson();
}

/// Entidades con identificador.
abstract interface class HasId {
  String get id;
}

/// Entidades con monto (para sumar totales).
abstract interface class HasAmount {
  double get amount;
}

/// BigDecimal de Java puede llegar como número o como texto.
double readAmount(Object? value) {
  if (value is num) {
    return value.toDouble();
  }
  if (value is String) {
    return double.tryParse(value) ?? 0.0;
  }
  return 0.0;
}

String readString(Object? value) => value == null ? '' : value.toString();

String? readNullableString(Object? value) => value == null ? null : value.toString();

bool readBool(Object? value) => value == true || value == 'true';

/// Convierte una respuesta de lista plana en objetos tipados.
List<T> readList<T>(Object? data, T Function(JsonMap json) fromJson) {
  if (data is! List) {
    return <T>[];
  }
  return data.whereType<Map<dynamic, dynamic>>().map((e) => fromJson(JsonMap.from(e))).toList();
}

JsonMap readMap(Object? data) {
  if (data is Map) {
    return JsonMap.from(data);
  }
  throw const FormatException('La respuesta del servidor no tiene el formato esperado.');
}
