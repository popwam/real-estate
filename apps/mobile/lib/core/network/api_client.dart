import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/api_config.dart';
import '../storage/secure_token_storage.dart';

final dioProvider = Provider<Dio>((ref) {
  final tokenStorage = ref.watch(secureTokenStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {'Accept': 'application/json'},
    ),
  );

  dio.interceptors.add(AuthInterceptor(dio: dio, tokenStorage: tokenStorage));
  return dio;
});

class AuthInterceptor extends Interceptor {
  AuthInterceptor({required Dio dio, required SecureTokenStorage tokenStorage})
    : _dio = dio,
      _tokenStorage = tokenStorage;

  final Dio _dio;
  final SecureTokenStorage _tokenStorage;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final path = options.path;
    final isAuthEndpoint =
        path.endsWith('/auth/login') || path.endsWith('/auth/refresh');

    if (!isAuthEndpoint) {
      final accessToken = await _tokenStorage.readAccessToken();
      if (accessToken != null) {
        options.headers['Authorization'] = 'Bearer $accessToken';
      }
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401 ||
        _isRefreshRequest(err.requestOptions)) {
      handler.next(err);
      return;
    }

    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null) {
      handler.next(err);
      return;
    }

    try {
      final refreshResponse = await _dio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': null}),
      );

      final data = refreshResponse.data;
      final accessToken = data?['accessToken'] as String?;
      final nextRefreshToken = data?['refreshToken'] as String?;
      if (accessToken == null || nextRefreshToken == null) {
        await _tokenStorage.clearTokens();
        handler.next(err);
        return;
      }

      await _tokenStorage.saveTokens(
        TokenPair(accessToken: accessToken, refreshToken: nextRefreshToken),
      );

      final retryOptions = err.requestOptions;
      retryOptions.headers['Authorization'] = 'Bearer $accessToken';
      final retryResponse = await _dio.fetch<dynamic>(retryOptions);
      handler.resolve(retryResponse);
    } catch (_) {
      await _tokenStorage.clearTokens();
      handler.next(err);
    }
  }

  bool _isRefreshRequest(RequestOptions options) {
    return options.path.endsWith('/auth/refresh');
  }
}
