import '../../../shared/models/json_helpers.dart';

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.role,
    this.firstName,
    this.lastName,
    this.phone,
  });

  final String id;
  final String email;
  final String role;
  final String? firstName;
  final String? lastName;
  final String? phone;

  String get displayName {
    final name = [firstName, lastName]
        .where((part) => part != null && part.trim().isNotEmpty)
        .join(' ');
    return name.isEmpty ? email : name;
  }

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: stringValue(json, 'id'),
      email: stringValue(json, 'email'),
      role: stringValue(json, 'role', fallback: stringValue(json, 'userRole')),
      firstName: json['firstName']?.toString(),
      lastName: json['lastName']?.toString(),
      phone: json['phone']?.toString(),
    );
  }
}

class AuthOrganization {
  const AuthOrganization({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.slug,
  });

  final String id;
  final String name;
  final String type;
  final String status;
  final String? slug;

  factory AuthOrganization.fromJson(Map<String, dynamic> json) {
    return AuthOrganization(
      id: stringValue(json, 'id'),
      name: stringValue(json, 'name'),
      type: stringValue(json, 'type'),
      status: stringValue(json, 'status'),
      slug: json['slug']?.toString(),
    );
  }
}

class AuthSession {
  const AuthSession({
    required this.user,
    required this.organization,
    required this.permissions,
  });

  final AuthUser user;
  final AuthOrganization? organization;
  final List<String> permissions;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] as Map<String, dynamic>? ?? json;
    final orgJson = json['organization'];

    return AuthSession(
      user: AuthUser.fromJson(userJson),
      organization: orgJson is Map<String, dynamic>
          ? AuthOrganization.fromJson(orgJson)
          : null,
      permissions: (json['permissions'] as List<dynamic>? ?? const [])
          .map((permission) => permission.toString())
          .toList(),
    );
  }
}
