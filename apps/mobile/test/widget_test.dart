import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile/app.dart';
import 'package:mobile/core/storage/secure_token_storage.dart';
import 'package:mobile/features/auth/data/auth_models.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/marketplace/data/marketplace_filters.dart';
import 'package:mobile/features/marketplace/data/marketplace_models.dart';
import 'package:mobile/features/marketplace/data/marketplace_repository.dart';

void main() {
  testWidgets('signed-out app opens marketplace, not forced login', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
    expect(find.text('No visible projects'), findsOneWidget);
    expect(find.text('Email or phone'), findsNothing);
  });

  testWidgets('login screen has Continue as guest', (tester) async {
    await tester.pumpWidget(_testApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    expect(find.text('Email or phone'), findsOneWidget);
    expect(find.text('Continue as guest'), findsOneWidget);

    await tester.tap(find.text('Continue as guest'));
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
  });

  testWidgets('successful login routes according to mocked role', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          loginSession: _session(
            role: 'DEVELOPER_ADMIN',
            permissions: const ['crm.leads.view_own'],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).first, 'dev@example.com');
    await tester.enterText(find.byType(TextFormField).last, 'password');
    await tester.tap(find.text('Sign in').last);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('CRM leads'), findsWidgets);
  });

  testWidgets('logout returns to marketplace', (tester) async {
    await tester.pumpWidget(
      _testApp(
        authRepository: _FakeAuthRepository(
          storedSession: _session(role: 'CLIENT'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Logout'));
    await tester.pumpAndSettle();

    expect(find.text('Marketplace'), findsOneWidget);
    expect(find.text('No visible projects'), findsOneWidget);
  });

  testWidgets('restores Arabic locale and keeps public marketplace usable', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    tester.platformDispatcher.textScaleFactorTestValue = 1.4;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });

    await tester.pumpWidget(
      _testApp(tokenStorage: _FakeTokenStorage(localeCode: 'ar')),
    );
    await tester.pumpAndSettle();

    final directionality = tester.widget<Directionality>(
      find
          .ancestor(
            of: find.byType(NavigationBar),
            matching: find.byType(Directionality),
          )
          .last,
    );

    expect(directionality.textDirection, TextDirection.rtl);
    expect(tester.takeException(), isNull);
  });
}

Widget _testApp({
  SecureTokenStorage? tokenStorage,
  AuthRepository? authRepository,
}) {
  final storage = tokenStorage ?? _FakeTokenStorage();
  return ProviderScope(
    overrides: [
      secureTokenStorageProvider.overrideWithValue(storage),
      authRepositoryProvider.overrideWithValue(
        authRepository ?? _FakeAuthRepository(),
      ),
      marketplaceRepositoryProvider.overrideWithValue(_FakeMarketplaceRepository()),
    ],
    child: const PopwamMobileApp(),
  );
}

AuthSession _session({
  required String role,
  List<String> permissions = const [],
}) {
  return AuthSession(
    user: AuthUser(
      id: 'user_1',
      email: 'demo@example.com',
      role: role,
      firstName: 'Demo',
      lastName: 'User',
    ),
    organization: const AuthOrganization(
      id: 'org_1',
      name: 'Demo Organization',
      type: 'BROKERAGE',
      status: 'ACTIVE',
    ),
    permissions: permissions,
  );
}

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({this.storedSession, this.loginSession});

  final AuthSession? storedSession;
  final AuthSession? loginSession;

  @override
  Future<void> clearTokens() async {}

  @override
  Future<bool> hasStoredSession() async => storedSession != null;

  @override
  Future<AuthSession> login({
    required String identifier,
    required String password,
  }) async {
    return loginSession ?? _session(role: 'CLIENT');
  }

  @override
  Future<void> logout() async {}

  @override
  Future<AuthSession> me() async {
    return storedSession ?? _session(role: 'CLIENT');
  }
}

class _FakeMarketplaceRepository implements MarketplaceRepository {
  @override
  Future<MarketplaceProject> getProject(String id) async {
    return const MarketplaceProject(
      id: 'project_1',
      name: 'Demo Project',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    );
  }

  @override
  Future<List<MarketplaceProject>> getProjects({
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    return const [];
  }

  @override
  Future<MarketplaceUnit> getUnit(String id) async {
    return const MarketplaceUnit(
      id: 'unit_1',
      status: 'AVAILABLE',
      visibility: 'PUBLIC',
    );
  }

  @override
  Future<List<MarketplaceUnit>> getUnits({
    String? projectId,
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    return const [];
  }

  @override
  Future<List<MarketplaceProject>> mapSearch({
    required double minLat,
    required double maxLat,
    required double minLng,
    required double maxLng,
    MarketplaceFilters filters = const MarketplaceFilters(),
  }) async {
    return const [];
  }
}

class _FakeTokenStorage extends SecureTokenStorage {
  _FakeTokenStorage({this.localeCode}) : super(const FlutterSecureStorage());

  String? localeCode;

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

  @override
  Future<String?> readLocaleCode() async => localeCode;

  @override
  Future<void> saveLocaleCode(String localeCode) async {
    this.localeCode = localeCode;
  }
}
