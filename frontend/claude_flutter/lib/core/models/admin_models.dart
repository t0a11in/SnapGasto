import 'package:equatable/equatable.dart';

import 'auth_models.dart';
import 'json_utils.dart';

class AdminUserRequest implements JsonEncodable {
  const AdminUserRequest({
    required this.fullName,
    required this.email,
    required this.role,
    this.password,
  });

  final String fullName;
  final String email;
  final Role role;

  /// Obligatoria al crear; opcional al editar (si viene, mínimo 8).
  final String? password;

  @override
  JsonMap toJson() => {
        'fullName': fullName,
        'email': email,
        'role': role.value,
        if (password != null) 'password': password,
      };
}

class AdminUserResponse extends Equatable implements HasId {
  const AdminUserResponse({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    required this.createdAt,
  });

  @override
  final String id;
  final String fullName;
  final String email;
  final Role role;
  final String createdAt;

  factory AdminUserResponse.fromJson(JsonMap json) => AdminUserResponse(
        id: readString(json['id']),
        fullName: readString(json['fullName']),
        email: readString(json['email']),
        role: Role.tryParse(json['role']) ?? Role.user,
        createdAt: readString(json['createdAt']),
      );

  @override
  List<Object?> get props => [id, fullName, email, role, createdAt];
}

class CategoryRequest implements JsonEncodable {
  const CategoryRequest({required this.name, this.icon, this.colorHex});

  final String name;
  final String? icon;

  /// Formato #RRGGBB
  final String? colorHex;

  @override
  JsonMap toJson() => {'name': name, 'icon': icon, 'colorHex': colorHex};
}

class CategoryResponse extends Equatable implements HasId {
  const CategoryResponse({required this.id, required this.name, this.icon, this.colorHex});

  @override
  final String id;
  final String name;
  final String? icon;
  final String? colorHex;

  factory CategoryResponse.fromJson(JsonMap json) => CategoryResponse(
        id: readString(json['id']),
        name: readString(json['name']),
        icon: readNullableString(json['icon']),
        colorHex: readNullableString(json['colorHex']),
      );

  @override
  List<Object?> get props => [id, name, icon, colorHex];
}

class AdminExpenseRequest implements JsonEncodable {
  const AdminExpenseRequest({
    required this.userId,
    required this.amount,
    required this.category,
    required this.date,
    required this.paymentMethod,
    this.description,
  });

  final String userId;
  final double amount;
  final String category;
  final String date;
  final String? description;
  final String paymentMethod;

  @override
  JsonMap toJson() => {
        'userId': userId,
        'amount': amount,
        'category': category,
        'date': date,
        'description': description,
        'paymentMethod': paymentMethod,
      };
}

class AdminExpenseResponse extends Equatable implements HasId, HasAmount {
  const AdminExpenseResponse({
    required this.id,
    required this.userId,
    required this.userName,
    required this.amount,
    required this.category,
    required this.date,
    required this.paymentMethod,
    this.description,
  });

  @override
  final String id;
  final String userId;
  final String userName;
  @override
  final double amount;
  final String category;
  final String date;
  final String? description;
  final String paymentMethod;

  factory AdminExpenseResponse.fromJson(JsonMap json) => AdminExpenseResponse(
        id: readString(json['id']),
        userId: readString(json['userId']),
        userName: readString(json['userName']),
        amount: readAmount(json['amount']),
        category: readString(json['category']),
        date: readString(json['date']),
        description: readNullableString(json['description']),
        paymentMethod: readString(json['paymentMethod']),
      );

  @override
  List<Object?> get props => [id, userId, userName, amount, category, date, description, paymentMethod];
}

class NotificationRequest implements JsonEncodable {
  const NotificationRequest({
    required this.userId,
    required this.title,
    required this.body,
    required this.read,
  });

  final String userId;
  final String title;
  final String body;
  final bool read;

  @override
  JsonMap toJson() => {'userId': userId, 'title': title, 'body': body, 'read': read};
}

class NotificationResponse extends Equatable implements HasId {
  const NotificationResponse({
    required this.id,
    required this.userId,
    required this.userName,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
  });

  @override
  final String id;
  final String userId;
  final String userName;
  final String title;
  final String body;
  final bool read;
  final String createdAt;

  factory NotificationResponse.fromJson(JsonMap json) => NotificationResponse(
        id: readString(json['id']),
        userId: readString(json['userId']),
        userName: readString(json['userName']),
        title: readString(json['title']),
        body: readString(json['body']),
        read: readBool(json['read']),
        createdAt: readString(json['createdAt']),
      );

  @override
  List<Object?> get props => [id, userId, userName, title, body, read, createdAt];
}
