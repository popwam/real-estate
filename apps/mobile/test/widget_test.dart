import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:mobile/app.dart';
import 'package:mobile/core/storage/secure_token_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('renders login screen when no session is stored', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          secureTokenStorageProvider.overrideWithValue(_FakeTokenStorage()),
        ],
        child: const PopwamMobileApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('POPWAM'), findsOneWidget);
    expect(find.text('Email or phone'), findsOneWidget);
    expect(find.text('Log in'), findsOneWidget);
  });
}

class _FakeTokenStorage extends SecureTokenStorage {
  _FakeTokenStorage() : super(const FlutterSecureStorage());

  @override
  Future<TokenPair?> readTokens() async => null;

  @override
  Future<String?> readAccessToken() async => null;

  @override
  Future<String?> readRefreshToken() async => null;

  @override
  Future<void> saveTokens(TokenPair tokens) async {}

  @override
  Future<void> clearTokens() async {}
}
