import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/errors/api_error.dart';
import '../../../core/utils/auth_debug_log.dart';
import '../data/auth_models.dart';
import '../data/auth_repository.dart';

enum AuthStatus { checking, signedOut, signedIn }

class AuthState {
  const AuthState({
    required this.status,
    this.session,
    this.errorMessage,
    this.routeAfterRestore = false,
  });

  final AuthStatus status;
  final AuthSession? session;
  final String? errorMessage;
  final bool routeAfterRestore;

  bool get isSignedIn => status == AuthStatus.signedIn && session != null;

  AuthState copyWith({
    AuthStatus? status,
    AuthSession? session,
    String? errorMessage,
    bool? routeAfterRestore,
  }) {
    return AuthState(
      status: status ?? this.status,
      session: session ?? this.session,
      errorMessage: errorMessage,
      routeAfterRestore: routeAfterRestore ?? this.routeAfterRestore,
    );
  }
}

class AuthController extends ChangeNotifier {
  AuthController(this._repository) {
    restore();
  }

  final AuthRepository _repository;

  AuthState _state = const AuthState(status: AuthStatus.checking);
  AuthState get state => _state;

  Future<void> restore() async {
    authDebugLog('Restoring stored mobile session');
    _state = const AuthState(status: AuthStatus.checking);
    notifyListeners();

    try {
      final hasTokens = await _repository.hasStoredSession();
      if (!hasTokens) {
        authDebugLog('No stored session found');
        _state = const AuthState(status: AuthStatus.signedOut);
        notifyListeners();
        return;
      }

      authDebugLog('Stored session found; loading current user');
      final session = await _repository.me();
      authDebugLog('Stored session restored');
      _state = AuthState(
        status: AuthStatus.signedIn,
        session: session,
        routeAfterRestore: true,
      );
    } catch (error) {
      authDebugLog('Stored session restore failed');
      await _repository.clearTokens();
      _state = AuthState(
        status: AuthStatus.signedOut,
        errorMessage: apiErrorMessage(error),
      );
    }
    notifyListeners();
  }

  Future<void> login(String identifier, String password) async {
    authDebugLog('Login flow started');
    _state = AuthState(status: AuthStatus.signedOut, errorMessage: null);
    notifyListeners();

    try {
      final session = await _repository.login(
        identifier: identifier,
        password: password,
      );
      authDebugLog('Navigating to mobile home');
      _state = AuthState(status: AuthStatus.signedIn, session: session);
      notifyListeners();
    } catch (error) {
      authDebugLog('Login flow failed');
      _state = AuthState(
        status: AuthStatus.signedOut,
        errorMessage: apiErrorMessage(error),
      );
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    authDebugLog('Logout started');
    await _repository.logout();
    _state = const AuthState(status: AuthStatus.signedOut);
    notifyListeners();
  }

  void consumeRestoreRouting() {
    if (!_state.routeAfterRestore) return;
    _state = _state.copyWith(routeAfterRestore: false);
  }
}

final authControllerProvider = Provider<AuthController>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider));
  ref.onDispose(controller.dispose);
  return controller;
});
