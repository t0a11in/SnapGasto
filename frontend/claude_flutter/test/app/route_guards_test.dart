import 'package:claude_flutter/app/router/route_guards.dart';
import 'package:claude_flutter/core/models/models.dart';
import 'package:claude_flutter/core/session/session_cubit.dart';
import 'package:flutter_test/flutter_test.dart';

SessionState _session(Role role) => SessionState(
      token: 't',
      user: UserResponse(id: '1', fullName: 'X', email: 'x@test.cl', role: role),
    );

void main() {
  const guest = SessionState();

  test('authGuard redirige a /login con returnUrl', () {
    expect(resolveRedirect(session: guest, uri: Uri.parse('/expenses')), '/login?returnUrl=%2Fexpenses');
  });

  test('authGuard permite con sesión', () {
    expect(resolveRedirect(session: _session(Role.user), uri: Uri.parse('/incomes')), isNull);
  });

  test('adminGuard bloquea a USER y permite a ADMIN', () {
    expect(resolveRedirect(session: _session(Role.user), uri: Uri.parse('/admin/users')), '/incomes');
    expect(resolveRedirect(session: _session(Role.admin), uri: Uri.parse('/admin/users')), isNull);
  });

  test('guestGuard saca del login a quien ya tiene sesión, respetando returnUrl', () {
    expect(resolveRedirect(session: guest, uri: Uri.parse('/login')), isNull);
    expect(resolveRedirect(session: _session(Role.user), uri: Uri.parse('/login')), '/incomes');
    expect(
      resolveRedirect(session: _session(Role.user), uri: Uri.parse('/login?returnUrl=%2Fexpenses')),
      '/expenses',
    );
    expect(
      resolveRedirect(session: _session(Role.user), uri: Uri.parse('/login?returnUrl=https://malo.com')),
      '/incomes',
    );
  });
}
