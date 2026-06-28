import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/localization/l10n_extensions.dart';
import '../../../core/router/auth_route_policy.dart';
import '../../../shared/widgets/language_selector.dart';
import 'auth_controller.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await ref
          .read(authControllerProvider)
          .login(_identifierController.text.trim(), _passwordController.text);
      if (mounted) {
        final session = ref.read(authControllerProvider).state.session;
        final from = GoRouterState.of(context).uri.queryParameters['from'];
        final target =
            session != null &&
                from != null &&
                from.isNotEmpty &&
                canAccessMobileRoute(session, Uri.parse(from).path)
            ? from
            : session == null
                ? publicHomeRoute
                : homeRouteForUser(
                    session.user,
                    permissions: session.permissions,
                  );
        context.go(target);
      }
    } catch (error) {
      if (mounted) {
        setState(() => _errorMessage = context.formatApiError(error));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(l10n.appTitle, style: theme.textTheme.displaySmall),
                    const SizedBox(height: 8),
                    Text(
                      l10n.appTagline,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const LanguageSelector(),
                    const SizedBox(height: 32),
                    TextFormField(
                      controller: _identifierController,
                      keyboardType: TextInputType.text,
                      autofillHints: const [
                        AutofillHints.username,
                        AutofillHints.email,
                        AutofillHints.telephoneNumber,
                      ],
                      decoration: InputDecoration(
                        labelText: l10n.emailOrPhone,
                        prefixIcon: const Icon(Icons.mail_outline),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l10n.emailOrPhoneRequired;
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      autofillHints: const [AutofillHints.password],
                      decoration: InputDecoration(
                        labelText: l10n.password,
                        prefixIcon: const Icon(Icons.lock_outline),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return l10n.passwordRequired;
                        }
                        return null;
                      },
                    ),
                    if (_errorMessage != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        _errorMessage!,
                        style: TextStyle(color: theme.colorScheme.error),
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.login),
                      label: Text(l10n.signIn),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _isSubmitting
                          ? null
                          : () => context.go(publicHomeRoute),
                      icon: const Icon(Icons.explore_outlined),
                      label: Text(l10n.continueAsGuest),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
