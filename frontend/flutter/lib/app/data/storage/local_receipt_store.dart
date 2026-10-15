import 'dart:io';

import 'package:get_storage/get_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

/// Copia comprobantes al espacio privado de la aplicación y mantiene un índice
/// local `expenseId -> ruta`. Ningún archivo ni ruta se envía a la API.
class LocalReceiptStore {
  LocalReceiptStore(this._storage);

  static const _receiptPathsKey = 'expense_receipt_paths';
  final GetStorage _storage;

  Future<String> save(XFile source) async {
    final sourceFile = File(source.path);
    if (!await sourceFile.exists()) {
      throw FileSystemException(
        'No se encontró la imagen seleccionada.',
        source.path,
      );
    }

    final documentsDirectory = await getApplicationDocumentsDirectory();
    final receiptsDirectory = Directory(
      path.join(documentsDirectory.path, 'expense-receipts'),
    );
    await receiptsDirectory.create(recursive: true);

    final extension = _safeExtension(source.path);
    final fileName =
        'receipt_${DateTime.now().microsecondsSinceEpoch}$extension';
    final destination = File(path.join(receiptsDirectory.path, fileName));
    await sourceFile.copy(destination.path);
    return destination.path;
  }

  Future<void> associate(String expenseId, String localPath) async {
    final paths = _paths();
    paths[expenseId] = localPath;
    await _storage.write(_receiptPathsKey, paths);
  }

  String? pathFor(String expenseId) => _paths()[expenseId];

  Future<void> deleteFor(String expenseId) async {
    final paths = _paths();
    final localPath = paths.remove(expenseId);
    await _storage.write(_receiptPathsKey, paths);
    if (localPath != null) {
      final file = File(localPath);
      if (await file.exists()) await file.delete();
    }
  }

  Future<void> deleteUnassociated(String? localPath) async {
    if (localPath == null) return;
    final file = File(localPath);
    if (await file.exists()) await file.delete();
  }

  Map<String, String> _paths() {
    final stored = _storage.read<dynamic>(_receiptPathsKey);
    if (stored is! Map) return <String, String>{};
    return stored.map(
      (key, value) => MapEntry(key.toString(), value.toString()),
    );
  }

  String _safeExtension(String originalPath) {
    final extension = path.extension(originalPath).toLowerCase();
    return const {'.jpg', '.jpeg', '.png', '.webp', '.heic'}.contains(extension)
        ? extension
        : '.jpg';
  }
}
