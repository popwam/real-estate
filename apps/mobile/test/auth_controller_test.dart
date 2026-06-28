import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/errors/api_error.dart';
import 'package:mobile/core/router/auth_route_policy.dart';
import 'package:mobile/features/auth/data/auth_models.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/presentation/auth_controller.dart';

void main() {
  test('login failure returns to signed-out state with an error', () async {
    final controller = AuthController(_FailingAuthRepository());

    await Future<void>.delayed(Duration.zero);

    await expectLater(
      controller.login('+201001234567', 'wrong-password'),
      throwsA(isA<ApiFriendlyException>()),
    );

    expect(controller.state.status, AuthStatus.signedOut);
    expect(controller.state.errorMessage, 'Invalid login details.');
  });

  test('homeRouteForUser maps roles to available mobile workspaces', () {
    expect(
      homeRouteForUser(
        _user('DEVELOPER_ADMIN'),
        permissions: const ['crm.leads.view_own'],
      ),
      '/crm-leads',
    );
    expect(
      homeRouteForUser(
        _user('BROKER'),
        permissions: const ['lead_claims.view_own'],
      ),
      '/lead-claims',
    );
    expect(homeRouteForUser(_user('CLIENT')), '/marketplace/projects');
  });
}

AuthUser _user(String role) {
  return AuthUser(id: 'user_1', email: 'demo@example.com', role: role);
}

class _FailingAuthRepository implements AuthRepository {
  @override
  Future<void> clearTokens() async {}

  @override
  Future<bool> hasStoredSession() async => false;

  @override
  Future<AuthSession> login({
    required String identifier,
    required String password,
  }) async {
    throw const ApiFriendlyException('Invalid login details.');
  }

  @override
  Future<void> logout() async {}

  @override
  Future<AuthSession> me() async {
    throw const ApiFriendlyException('No stored session.');
  }
}
