import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TokenPair {
  const TokenPair({required this.accessToken, required this.refreshToken});

  final String accessToken;
  final String refreshToken;
}

class SecureTokenStorage {
  SecureTokenStorage(this._storage);

  static const _accessTokenKey = 'popwam_access_token';
  static const _refreshTokenKey = 'popwam_refresh_token';
  static const _localeCodeKey = 'popwam_locale_code';

  final FlutterSecureStorage _storage;

  Future<TokenPair?> readTokens() async {
    final accessToken = await _storage.read(key: _accessTokenKey);
    final refreshToken = await _storage.read(key: _refreshTokenKey);

    if (accessToken == null || refreshToken == null) {
      return null;
    }

    return TokenPair(accessToken: accessToken, refreshToken: refreshToken);
  }

  Future<String?> readAccessToken() => _storage.read(key: _accessTokenKey);

  Future<String?> readRefreshToken() => _storage.read(key: _refreshTokenKey);

  Future<void> saveTokens(TokenPair tokens) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: tokens.accessToken),
      _storage.write(key: _refreshTokenKey, value: tokens.refreshToken),
    ]);
  }

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }

  Future<String?> readLocaleCode() => _storage.read(key: _localeCodeKey);

  Future<void> saveLocaleCode(String localeCode) {
    return _storage.write(key: _localeCodeKey, value: localeCode);
  }
}

final secureTokenStorageProvider = Provider<SecureTokenStorage>((ref) {
  const storage = FlutterSecureStorage();
  return SecureTokenStorage(storage);
});
