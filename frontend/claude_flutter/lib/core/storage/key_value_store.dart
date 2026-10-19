import 'package:shared_preferences/shared_preferences.dart';

/// Almacenamiento clave/valor (equivalente a BrowserStorageService).
abstract interface class KeyValueStore {
  String? getString(String key);

  Future<void> setString(String key, String value);

  Future<void> remove(String key);
}

/// Implementación con SharedPreferences. Nunca lanza: si el almacenamiento falla se ignora.
class SharedPrefsStore implements KeyValueStore {
  SharedPrefsStore(this._prefs);

  final SharedPreferences _prefs;

  @override
  String? getString(String key) {
    try {
      return _prefs.getString(key);
    } on Object {
      return null;
    }
  }

  @override
  Future<void> setString(String key, String value) async {
    try {
      await _prefs.setString(key, value);
    } on Object {
      // almacenamiento no disponible: se ignora
    }
  }

  @override
  Future<void> remove(String key) async {
    try {
      await _prefs.remove(key);
    } on Object {
      // almacenamiento no disponible: se ignora
    }
  }
}

/// Implementación en memoria (pruebas).
class InMemoryStore implements KeyValueStore {
  InMemoryStore([Map<String, String>? initial]) : values = {...?initial};

  final Map<String, String> values;

  @override
  String? getString(String key) => values[key];

  @override
  Future<void> setString(String key, String value) async {
    values[key] = value;
  }

  @override
  Future<void> remove(String key) async {
    values.remove(key);
  }
}
