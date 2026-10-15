import 'package:get_storage/get_storage.dart';

import '../../config/backend_target.dart';

/// Conserva la selección de backend para reutilizar el mismo puerto al abrir la app.
class BackendTargetStore {
  BackendTargetStore(this._storage);

  static const _targetKey = 'backend_target';
  final GetStorage _storage;

  BackendTarget get current =>
      BackendTarget.fromName(_storage.read<String>(_targetKey));

  Future<void> save(BackendTarget target) =>
      _storage.write(_targetKey, target.name);
}
