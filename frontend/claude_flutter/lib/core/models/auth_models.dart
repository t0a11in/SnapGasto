import 'package:equatable/equatable.dart';

import 'json_utils.dart';

enum Role {
  admin('ADMIN'),
  user('USER');

  const Role(this.value);

  final String value;

  static Role? tryParse(Object? value) => switch (value) {
        'ADMIN' => Role.admin,
        'USER' => Role.user,
        _ => null,
      };
}

class UserResponse extends Equatable {
  const UserResponse({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
  });

  final String id;
  final String fullName;
  final String email;
  final Role role;

  factory UserResponse.fromJson(JsonMap json) {
    final user = tryFromJson(json);
    if (user == null) {
      throw const FormatException('Usuario inválido en la respuesta.');
    }
    return user;
  }

  /// null si el JSON no es un usuario válido (p. ej. sesión persistida corrupta).
  static UserResponse? tryFromJson(Object? json) {
    if (json is! Map) {
      return null;
    }
    final role = Role.tryParse(json['role']);
    final email = json['email'];
    if (role == null || email is! String) {
      return null;
    }
    return UserResponse(
      id: readString(json['id']),
      fullName: readString(json['fullName']),
      email: email,
      role: role,
    );
  }

  JsonMap toJson() => {'id': id, 'fullName': fullName, 'email': email, 'role': role.value};

  @override
  List<Object?> get props => [id, fullName, email, role];
}

class AuthRequest implements JsonEncodable {
  const AuthRequest({required this.email, required this.password});

  final String email;
  final String password;

  @override
  JsonMap toJson() => {'email': email, 'password': password};
}

class RegisterRequest implements JsonEncodable {
  const RegisterRequest({required this.fullName, required this.email, required this.password});

  final String fullName;
  final String email;
  final String password;

  @override
  JsonMap toJson() => {'fullName': fullName, 'email': email, 'password': password};
}

class AuthResponse {
  const AuthResponse({required this.accessToken, required this.user});

  final String accessToken;
  final UserResponse user;

  factory AuthResponse.fromJson(JsonMap json) => AuthResponse(
        accessToken: readString(json['accessToken']),
        user: UserResponse.fromJson(readMap(json['user'])),
      );
}

class TokenStatusResponse {
  const TokenStatusResponse({required this.tokenAlive});

  final bool tokenAlive;

  factory TokenStatusResponse.fromJson(JsonMap json) =>
      TokenStatusResponse(tokenAlive: readBool(json['tokenAlive']));
}
