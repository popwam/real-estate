import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_token_storage.dart';
import 'auth_models.dart';

class AuthRepository {
  AuthRepository({required Dio dio, required SecureTokenStorage tokenStorage})
    : _dio = dio,
      _tokenStorage = tokenStorage;

  final Dio _dio;
  final SecureTokenStorage _tokenStorage;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    final data = response.data ?? <String, dynamic>{};
    await _tokenStorage.saveTokens(
      TokenPair(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      ),
    );
    return AuthSession.fromJson(data);
  }

  Future<AuthSession> me() async {
    final response = await _dio.get<Map<String, dynamic>>('/auth/me');
    return AuthSession.fromJson(response.data ?? <String, dynamic>{});
  }

  Future<bool> hasStoredSession() async {
    return (await _tokenStorage.readTokens()) != null;
  }

  Future<void> logout() async {
    try {
      await _dio.post<void>('/auth/logout');
    } finally {
      await _tokenStorage.clearTokens();
    }
  }

  Future<void> clearTokens() => _tokenStorage.clearTokens();
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    tokenStorage: ref.watch(secureTokenStorageProvider),
  );
});
