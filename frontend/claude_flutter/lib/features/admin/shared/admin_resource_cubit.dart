import 'package:equatable/equatable.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/data/admin_crud_api.dart';
import '../../../core/http/error_utils.dart';
import '../../../core/models/models.dart';

class AdminResourceState<T> extends Equatable {
  const AdminResourceState({
    this.items = const [],
    this.loading = false,
    this.loaded = false,
    this.error,
  });

  final List<T> items;
  final bool loading;
  final bool loaded;
  final String? error;

  int get count => items.length;

  AdminResourceState<T> copyWith({
    List<T>? items,
    bool? loading,
    bool? loaded,
    ValueGetter<String?>? error,
  }) {
    return AdminResourceState<T>(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      loaded: loaded ?? this.loaded,
      error: error != null ? error() : this.error,
    );
  }

  @override
  List<Object?> get props => [items, loading, loaded, error];
}

/// Estado genérico para un mantenedor ADMIN (listado plano + CRUD).
/// Cada recurso tiene su subclase para poder ubicarla en el árbol por tipo.
abstract class AdminResourceCubit<TReq extends JsonEncodable, TRes extends HasId>
    extends Cubit<AdminResourceState<TRes>> {
  AdminResourceCubit(this._api) : super(AdminResourceState<TRes>());

  final AdminCrudApi<TReq, TRes> _api;

  Future<void> load() async {
    emit(state.copyWith(loading: true, error: () => null));
    try {
      final items = await _api.list();
      if (!isClosed) {
        emit(state.copyWith(items: items, loading: false, loaded: true));
      }
    } on Object catch (e) {
      if (!isClosed) {
        emit(state.copyWith(loading: false, error: () => errorMessage(e)));
      }
    }
  }

  /// Crea (id null) o actualiza; lanza `AppHttpError` si falla.
  Future<TRes> save(String? id, TReq body) async {
    final saved = id == null ? await _api.create(body) : await _api.update(id, body);
    _upsert(saved);
    return saved;
  }

  /// Elimina; lanza `AppHttpError` si falla.
  Future<void> remove(String id) async {
    await _api.remove(id);
    if (!isClosed) {
      emit(state.copyWith(items: state.items.where((i) => i.id != id).toList()));
    }
  }

  void _upsert(TRes saved) {
    if (isClosed) {
      return;
    }
    if (saved.id.isEmpty) {
      load();
      return;
    }
    final list = [...state.items];
    final index = list.indexWhere((i) => i.id == saved.id);
    if (index == -1) {
      list.insert(0, saved);
    } else {
      list[index] = saved;
    }
    emit(state.copyWith(items: list));
  }
}
