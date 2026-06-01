import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_models.dart';
import '../data/auth_repository.dart';

enum AuthStatus { checking, signedOut, signedIn }

class AuthState {
  const AuthState({
    required this.status,
    this.session,
    this.errorMessage,
  });

  final AuthStatus status;
  final AuthSession? session;
  final String? errorMessage;

  bool get isSignedIn => status == AuthStatus.signedIn && session != null;

  AuthState copyWith({
    AuthStatus? status,
    AuthSession? session,
    String? errorMessage,
  }) {
    return AuthState(
      status: status ?? this.status,
      session: session ?? this.session,
      errorMessage: errorMessage,
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
    _state = const AuthState(status: AuthStatus.checking);
    notifyListeners();

    final hasTokens = await _repository.hasStoredSession();
    if (!hasTokens) {
      _state = const AuthState(status: AuthStatus.signedOut);
      notifyListeners();
      return;
    }

    try {
      final session = await _repository.me();
      _state = AuthState(status: AuthStatus.signedIn, session: session);
    } catch (_) {
      await _repository.clearTokens();
      _state = const AuthState(status: AuthStatus.signedOut);
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _state = const AuthState(status: AuthStatus.checking);
    notifyListeners();

    final session = await _repository.login(email: email, password: password);
    _state = AuthState(status: AuthStatus.signedIn, session: session);
    notifyListeners();
  }

  Future<void> logout() async {
    await _repository.logout();
    _state = const AuthState(status: AuthStatus.signedOut);
    notifyListeners();
  }
}

final authControllerProvider = Provider<AuthController>((ref) {
  final controller = AuthController(ref.watch(authRepositoryProvider));
  ref.onDispose(controller.dispose);
  return controller;
});
