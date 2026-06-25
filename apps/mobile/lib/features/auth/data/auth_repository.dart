import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_token_storage.dart';
import '../../../core/utils/auth_debug_log.dart';
import 'auth_models.dart';

class AuthRepository {
  AuthRepository({required Dio dio, required SecureTokenStorage tokenStorage})
    : _dio = dio,
      _tokenStorage = tokenStorage;

  final Dio _dio;
  final SecureTokenStorage _tokenStorage;

  Future<AuthSession> login({
    required String identifier,
    required String password,
  }) async {
    authDebugLog('Login request started');

    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'identifier': identifier, 'password': password},
      );
      authDebugLog('Login response received: ${response.statusCode}');

      final data = response.data ?? <String, dynamic>{};
      final accessToken = data['accessToken'] as String?;
      final refreshToken = data['refreshToken'] as String?;

      if (accessToken == null || refreshToken == null) {
        authDebugLog('Login failed: token payload missing');
        throw const ApiFriendlyException(
          'Login response was incomplete. Please try again.',
        );
      }

      await _tokenStorage.saveTokens(
        TokenPair(accessToken: accessToken, refreshToken: refreshToken),
      );
      authDebugLog('Token stored');

      authDebugLog('Loading current user');
      final session = await me();
      authDebugLog('Current user loaded');
      return session;
    } catch (error) {
      authDebugLog('Login failed: ${_safeFailureLabel(error)}');
      await _tokenStorage.clearTokens();
      rethrow;
    }
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

String _safeFailureLabel(Object error) {
  if (error is DioException) {
    return 'dio ${error.type.name} ${error.response?.statusCode ?? ''}'.trim();
  }

  if (error is ApiFriendlyException) {
    return 'friendly error';
  }

  return error.runtimeType.toString();
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    tokenStorage: ref.watch(secureTokenStorageProvider),
  );
});
